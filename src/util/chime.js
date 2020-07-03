import {
    ConsoleLogger,
    DefaultDeviceController,
    DefaultMeetingSession,
    LogLevel,
    DefaultModality,
    MeetingSessionConfiguration
} from 'amazon-chime-sdk-js';
import axios from 'axios';
import { url } from "../config"
/**
 * Depricated Method
 */
function getAllMembers(id, ref) {
    console.log("------------------------ get memebers");
    var obj = {
        // meetingName: this.state.meetingResponse.Meeting.MeetingId
        meetingName: id
    }
    getAllMembers = getAllMembers.bind(ref);
    axios.post(url + "getAllAttendees", obj).then(res => {
        console.log("resp-------------------------- is  ", res);
        var attendees = res.data.attendees.Attendees;
        // document.getElementById("attendess").innerHTML = '';
        var temp = [];
        attendees.map((index, key) => {
            temp.push({
                title: index.ExternalUserId
            })
            // if (key == attendees.length - 1)
            //     document.getElementById("attendess").innerHTML += index.ExternalUserId
            // else
            //     document.getElementById("attendess").innerHTML += index.ExternalUserId + ', '
        })
        ref.setState({
            attendees: temp,
            display: false
        })
        console.log("state -------------- ", ref);
        // document.getElementById("attendess").innerHTML = "New text!";
    }).catch(err => {
        console.log("------------------------ wrrrrrrr-------------");
        if (err.response != undefined) {
            console.log(err.response);
        }
        else {
            console.log(err);
        }

    })
}
/**
 * This function initialize the meeting session
 */
const chimeFunctios = {
    initialize: (meetingResponse, attendeeResponse, ref) => {
        chimeFunctios.initialize = chimeFunctios.initialize.bind(ref);
        const logger = new ConsoleLogger('MyLogger', LogLevel.INFO);
        const deviceController = new DefaultDeviceController(logger);
        const configuration = new MeetingSessionConfiguration(meetingResponse, attendeeResponse);

        // In the usage examples below, you will use this meetingSession object.
        const meetingSession = new DefaultMeetingSession(
            configuration,
            logger,
            deviceController
        );
        ref.setState({
            defaultAttendeeID: meetingSession.configuration.credentials.attendeeId,
            defaultAttendeeName: meetingSession.configuration.credentials.externalUserId,
        })
        // getAllMembers(meetingResponse.Meeting.MeetingId)
        return meetingSession;
    },
    configureAudioFunction: async (meetingSession, audioElement) => {
        try {
            const audioInputs = await meetingSession.audioVideo.listAudioInputDevices();
            await meetingSession.audioVideo.chooseAudioInputDevice(audioInputs[0].deviceId);
            const audioOutputElement = document.getElementById(audioElement);
            meetingSession.audioVideo.bindAudioElement(audioOutputElement);
            meetingSession.audioVideo.start();
            return {
                sucess: true,
                message: "Success"
            }
        } catch (error) {
            return {
                sucess: false,
                message: error
            }
        }

    },
    configureVideoFunction: async (meetingSession, audioElement) => {

        try {
            const videoInputDevices = await meetingSession.audioVideo.listVideoInputDevices();
            console.log('video output devices are ', videoInputDevices);
            if (videoInputDevices.length > 0) {
                await meetingSession.audioVideo.chooseVideoInputDevice(videoInputDevices[0].deviceId);
                meetingSession.audioVideo.startLocalVideoTile();
            }

            else
                alert("no video device found");
            // ref.setState({});
            return {
                sucess: true,
                message: "Success"
            }
        } catch (error) {
            return {
                sucess: false,
                message: error
            }
        }

    },
    subscribeToAttendeeChanges: (meetingSession, id, ref) => {

        meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence((presentAttendeeId, present, externalUserId) => {
            console.log(`Attendee ID: ${presentAttendeeId} Present: ${present} user: ${externalUserId}`);
            var attendees = ref.state.attendees;
            console.log('Attendee are :', attendees);
            if (present) {
                var result = attendees.find(x => x.title == externalUserId);
                if (result == null) {
                    attendees.push({
                        title: externalUserId,
                        id: presentAttendeeId,
                        mute: false,
                        display: true,
                        isAdmin: presentAttendeeId == ref.state.defaultAttendeeID && ref.state.admin == true ? true : false

                    });
                    ref.setState({
                        attendees: attendees
                    })
                }
                //check if this member is admin  - this is to send message to everyone -
                //in order to communicate them about who is host whenever a new person arrives
                if (ref.state.admin) {
                    var payload = {
                        action: 'makeAdmin',
                        attendeeId: ref.state.defaultAttendeeID,
                        attendeeName: ref.state.defaultAttendeeName
                    };
                    chimeFunctios.sendMessage(meetingSession, 'Actions', payload)
                }
            }
            else {
                var result = attendees.find(x => x.title == externalUserId);
                if (result) {
                    var indx = attendees.findIndex(x => x.title === externalUserId);

                    console.log("index is -------------", indx)
                    attendees.splice(indx, 1);
                    ref.setState({
                        attendees: attendees,

                    })
                }

            }

            chimeFunctios.subscribeToVolumeChanges(meetingSession, presentAttendeeId, ref);

        });
    },
    mute: (meetingSession) => {
        meetingSession.audioVideo.realtimeMuteLocalAudio();
    },
    unMute: (meetingSession) => {
        const unmuted = meetingSession.audioVideo.realtimeUnmuteLocalAudio();
        if (unmuted) {
            // alert("Un muted Successfully")
            console.log('Other attendees can hear your audio');
        } else {
            // See the realtimeSetCanUnmuteLocalAudio use case below.
            console.log('You cannot unmute yourself');
        }
    },
    sendMessage: (meetingSession, topic, message) => {
        console.log("going to send message", topic, message);
        meetingSession.audioVideo.realtimeSendDataMessage(topic, message);
    },
    subscribeToMessages(meetingSession, ref) {
        chimeFunctios.subscribeToMessages = chimeFunctios.subscribeToMessages.bind(ref);
        meetingSession.audioVideo.realtimeSubscribeToReceiveDataMessage(
            'Actions',
            (dataMessage) => {
                console.log("----------------arsl-------------- ", dataMessage)
                var selfAttendeeId = meetingSession.configuration.credentials.attendeeId;
                var selfAttendeeName = meetingSession.configuration.credentials.externalUserId;
                var payload = dataMessage.json();

                if (payload.action === 'mute') {
                    if (payload.attendeeId === selfAttendeeId && payload.attendeeName == selfAttendeeName) {
                        chimeFunctios.mute(meetingSession);
                    }
                }
                else if (payload.action === 'unMute') {
                    if (payload.attendeeId === selfAttendeeId && payload.attendeeName == selfAttendeeName) {
                        chimeFunctios.unMute(meetingSession);
                    }
                }
                else if (payload.action === 'selfEnableVideo') {
                    var attendees = ref.state.attendees;
                    var attendee = attendees.find(x => x.id === payload.attendeeId);
                    attendee.display = true;
                    ref.setState({
                        attendees: attendees
                    });
                }
                else if (payload.action === 'selfDisableVideo') {
                    //find that attendee and do action with that attendee
                    var attendees = ref.state.attendees;
                    var attendee = attendees.find(x => x.id === payload.attendeeId);
                    attendee.display = false;
                    ref.setState({
                        attendees: attendees
                    });

                }
                else if (payload.action === 'enableVideo') {
                    if (payload.attendeeId === selfAttendeeId && payload.attendeeName == selfAttendeeName) {
                        ref.setState({ activateVideoByAdmin: true })
                    }
                }
                else if (payload.action === 'disableVideo') {
                    if (payload.attendeeId === selfAttendeeId && payload.attendeeName == selfAttendeeName) {
                        ref.deActivateVideo();
                    }
                }
                else if (payload.action === 'makeAdmin') {

                    var attendees = ref.state.attendees;
                    attendees.map((index, key) => {
                        if (index.title == dataMessage.senderExternalUserId && index.id == dataMessage.senderAttendeeId) {
                            index.isAdmin = true;
                        }
                        else
                            index.isAdmin = false;
                    });
                    ref.setState({
                        attendees: attendees
                    });
                }

            }
        );
    },
    subscribeToVolumeChanges(meetingSession, presentAttendeeId, ref) {
        chimeFunctios.subscribeToVolumeChanges = chimeFunctios.subscribeToVolumeChanges.bind(ref);
        meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator(
            presentAttendeeId,
            (attendeeId, volume, muted, signalStrength, externalUserId) => {
                if (muted == true) {
                    var attendees = ref.state.attendees;
                    var index = attendees.findIndex(x => x.title == externalUserId);
                    if (attendees[index].mute == false) {
                        attendees[index].mute = true;
                        ref.setState({
                            attendees: attendees,
                            display: false
                        })
                    }

                } else {
                    var attendees = ref.state.attendees;
                    var index = attendees.findIndex(x => x.title == externalUserId);
                    if (attendees[index].mute == true) {
                        attendees[index].mute = false;
                        ref.setState({
                            attendees: attendees,
                            display: false
                        })
                    }

                }
            }
        );
    },

}

export default chimeFunctios