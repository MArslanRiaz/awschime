import React, { Component, useState } from 'react';
import {
    ConsoleLogger,
    DefaultDeviceController,
    DefaultMeetingSession,
    LogLevel,
    DefaultModality,
    MeetingSessionConfiguration
} from 'amazon-chime-sdk-js';
import { Input, Button, Row, Col } from 'antd'
import axios from 'axios';
import 'antd/dist/antd.css'
import { url } from "../config"
import { LoadingOutlined, UploadOutlined, MailOutlined, UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
var meetingSession;
var indexMap = {};
var numOfPersonels = 8;
class Session extends Component {
    constructor(props) {
        super(props);

        var a = JSON.parse(localStorage.getItem("meeting"));
        this.state = {
            dislpay: false,
            attendeeResponse: a.attendeeResponse,
            meetingResponse: a.meetingResponse
        }
        this.getAllMembers = this.getAllMembers.bind(this);
        this.EndMeeting = this.EndMeeting.bind(this);
        this.leaveMeeting = this.leaveMeeting.bind(this);
        this.activateVideo = this.activateVideo.bind(this);
        this.deActivateVideo = this.deActivateVideo.bind(this);
        this.acquireVideoElement = this.acquireVideoElement.bind(this);
        // console.log("---------------------------------- ss", this.state);
        var th = this;
        setTimeout(() => {
            th.setState({})
        }, 20000);
    }
    releaseVideoElement = tileId => {
        for (let i = 0; i < numOfPersonels; i += 1) {
            if (indexMap[i] === tileId) {
                delete indexMap[i];
                return;
            }
        }
    };
    async componentWillMount() {
        const logger = new ConsoleLogger('MyLogger', LogLevel.INFO);
        const deviceController = new DefaultDeviceController(logger);
        const configuration = new MeetingSessionConfiguration(this.state.meetingResponse, this.state.attendeeResponse);

        // In the usage examples below, you will use this meetingSession object.
        meetingSession = new DefaultMeetingSession(
            configuration,
            logger,
            deviceController
        );
        try {

            const audioInputs = await meetingSession.audioVideo.listAudioInputDevices();
            await meetingSession.audioVideo.chooseAudioInputDevice(audioInputs[0].deviceId);

            // The camera LED light will turn on indicating that it is now capturing.
            // See the "Device" section for details.

            // console.log("---------------------------------------------------ssss", videoInputDevices.length);
            //  await this.activateVideo(meetingSession)
            const audioOutputElement = document.getElementById('myAudio');
            meetingSession.audioVideo.bindAudioElement(audioOutputElement);
            meetingSession.audioVideo.start();
            // console.log("---------------------------------------------------aaaaaaaaaaaaa", videoInputDevices.length);
            // if (videoInputDevices.length > 0) {
            // alert("Asdasd");
            await this.activateVideo();




        } catch (err) {
            alert("error occured");
            console.log(err);
            // handle error - unable to acquire audio device perhaps due to permissions blocking
        }
    }
    acquireVideoElement(tileId) {
        var videoElements = [
            document.getElementById(`myVideo-1`),
            document.getElementById(`myVideo-2`),
            document.getElementById(`myVideo-3`),
            document.getElementById(`myVideo-4`),
            document.getElementById(`myVideo-5`),
            document.getElementById(`myVideo-6`),
            document.getElementById(`myVideo-7`),
            document.getElementById(`myVideo-8`),
        ]
        for (let i = 0; i < numOfPersonels; i += 1) {
            if (indexMap[i] === tileId) {
                return videoElements[i];
            }
        }
        // Return the next available video element.
        for (let i = 0; i < numOfPersonels; i += 1) {
            if (!indexMap.hasOwnProperty(i)) {
                indexMap[i] = tileId;
                return videoElements[i];
            }
        }
        throw new Error('no video element is available');
    }
    async activateVideo() {
        // const videoElFement =  ;
        let localTileId = null;
        // Make sure you have chosen your camera. In this use case, you will choose the first device.
        const videoInputDevices = await meetingSession.audioVideo.listVideoInputDevices();
        console.log('video output devices are ', videoInputDevices);
        if (videoInputDevices.length > 0)
            await meetingSession.audioVideo.chooseVideoInputDevice(videoInputDevices[0].deviceId);
        else
            alert("no video device found");
        const observer = {
            // videoTileDidUpdate is called whenever a new tile is created or tileState changes.
            videoTileDidUpdate: tileState => {
                // Ignore a tile without attendee ID and other attendee's tile.
                if (!tileState.boundAttendeeId) {
                    return;
                }
                const selfAttendeeId = meetingSession.configuration.credentials.attendeeId;
                console.log("going to assigb video self attendee--------------------", selfAttendeeId);
                const modality = new DefaultModality(tileState.boundAttendeeId);
                console.log("going to assigb video modality is--------------------", modality);
                if (modality.base() === selfAttendeeId && modality.hasModality(DefaultModality.MODALITY_CONTENT)) {
                    // don't bind one's own content
                    return;
                }
                localTileId = tileState.tileId;

                console.log("going to assigb video--------------------", tileState);

                meetingSession.audioVideo.bindVideoElement(tileState.tileId, this.acquireVideoElement(tileState.tileId));
            },
            videoTileWasRemoved: tileId => {
                this.releaseVideoElement(tileId);
            }

        };
        // meetingSession.audioVideo.startVideoPreviewForVideoInput(document.getElementById('myVideoP'));

        meetingSession.audioVideo.addObserver(observer);

        meetingSession.audioVideo.startLocalVideoTile();
        this.setState({});

    }
    deActivateVideo() {
        meetingSession.audioVideo.removeLocalVideoTile();
    }
    getAllMembers() {
        // setdisplay(true);
        this.setState({ dislpay: true });
        var obj = {
            meetingName: this.state.meetingResponse.Meeting.MeetingId
        }
        axios.post(url + "getAllAttendees", obj).then(res => {
            this.setState({ dislpay: false });
            var attendees = res.data.attendees.Attendees;
            attendees.map((index, key) => {
                if (key == attendees.length - 1)
                    document.getElementById("attendess").innerHTML += index.ExternalUserId
                else
                    document.getElementById("attendess").innerHTML += index.ExternalUserId + ', '
            })

            // document.getElementById("attendess").innerHTML = "New text!";
        }).catch(err => {
            // setdisplay(false);
            this.setState({ dislpay: false });
            if (err.response != undefined) {
                console.log(err.response);
                alert(err.response.data)
            }
            else {
                console.log(err);
                alert(err)
            }

        })
    }

    leaveMeeting() {
        this.setState({ dislpay: true });
        var obj = {
            meetingName: this.state.meetingResponse.Meeting.MeetingId,
            attendeeId: this.state.attendeeResponse.Attendee.AttendeeId
        }
        axios.post(url + "leaveMeeting", obj).then(res => {
            this.setState({ dislpay: false });
            this.props.history.push("/")
        }).catch(err => {
            // setdisplay(false);
            meetingSession.audioVideo.removeLocalVideoTile();
            this.setState({ dislpay: false });
            if (err.response != undefined) {
                console.log(err.response);
                alert(err.response.data)
            }
            else {
                console.log(err);
                alert(err)
            }

        })
    }
    render() {
        // if (meetingSession) {
        //     this.activateVideo(meetingSession)
        // }
        return (

            <div>
                <header >
                    <Row>
                        <Col></Col>
                        <Col>
                            <Row><Col xs="4"><p id="myVideoText-1" ></p>
                                <video id="myVideo-1" width="250" ></video></Col>
                                <Col xs="4"> <p id="myVideoText-2" ></p>
                                    <video id="myVideo-2" width="250" ></video></Col>
                                <Col xs="4"> <p id="myVideoText-3" ></p>
                                    <video id="myVideo-3" width="250"></video></Col>
                                <Col xs="4"> <p id="myVideoText-4" ></p>
                                    <video id="myVideo-4" width="250" ></video></Col>
                            </Row>
                            <Row><Col xs="4"><p id="myVideoText-5" ></p>
                                <video id="myVideo-5" width="250" ></video></Col>
                                <Col xs="4"> <p id="myVideoText-6" ></p>
                                    <video id="myVideo-6" width="250" ></video></Col>
                                <Col xs="4"> <p id="myVideoText-7" ></p>
                                    <video id="myVideo-7" width="250"></video></Col>
                                <Col xs="4"> <p id="myVideoText-8" ></p>
                                    <video id="myVideo-8" width="250" ></video></Col>
                            </Row>
                            <audio id="myAudio"></audio>

                            {/* <p>meeting</p> */}
                            <Button onClick={
                                this.activateVideo
                            }>Enable Video</Button>
                            <Button onClick={
                                this.deActivateVideo
                            }>Disable video</Button>


                            <Button onClick={
                                this.getAllMembers
                            }>Show Active Members</Button>

                            <Button onClick={
                                this.leaveMeeting
                            }>Leave Meeting</Button><br />
                            <p>All Available personels Are</p>
                            {this.state.dislpay ? <LoadingOutlined style={{ fontSize: 50, paddingLeft: "42%" }} spin /> : <p id="attendess"> </p>}

                        </Col>
                        <Col></Col>
                    </Row>

                </header>
            </div >
        );
    }
}

export default Session;
