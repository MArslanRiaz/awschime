//dont del it

import React, { Component, useState } from 'react';
import {
    ConsoleLogger,
    DefaultDeviceController,
    DefaultMeetingSession,
    LogLevel,
    DefaultModality,
    MeetingSessionConfiguration,
    MeetingSessionStatusCode
} from 'amazon-chime-sdk-js';
import { Input, Button, Row, Col, List } from 'antd'
import axios from 'axios';
import 'antd/dist/antd.css'
import { url } from "../config"
import ReactPlayer from 'react-player'
import { LoadingOutlined, AudioMutedOutlined, AudioOutlined, EyeOutlined, EyeInvisibleFilled } from '@ant-design/icons';
import Header from './header';
import chimeFunctios from "../util/chime"
import logo from "../assets/images/geniLogo.jpg"
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
var meetingSession;
var indexMap = {};
var tilesData = [
    {
        videoID: '',
        tileNum: '',
        tileState: "",
        externalUser: ''
    }
]
var numOfPersonels = 8;
var videoFlag = true;
const data = [
];
class Meeting extends Component {
    constructor(props) {
        super(props);
        this.roster = {};
        var a = JSON.parse(localStorage.getItem("meeting"));
        this.state = {
            url: a.url,
            dislpay: false,     // for loadinf screen
            defaultAttendeeID: '',      //the id of the current attendee
            defaultAttendeeName: '',    //the name of the current attendee
            attendeeResponse: a.attendeeResponse,       //attendess response from backened 
            meetingResponse: a.meetingResponse,          //meeting response from backened 
            meetingName: a.meetingName ? a.meetingName : "Meeting",
            admin: a.admin ? a.admin : false,                   // to check if the user is also a admin or not
            test: false,                                        // this variable is for testing duringg developement
            videoText: true,                                        //this to check if there is no video clicked so display a centain text
            activateVideoByAdmin: false,                            // this variable is to check if admin has enable video for this attendee so we can active it
            attendees: []                                   //contains all data of all attendees in a session 
        }
        this.EndMeeting = this.EndMeeting.bind(this);
        this.leaveMeeting = this.leaveMeeting.bind(this);
        this.acquireVideoElement = this.acquireVideoElement.bind(this);
        this.changeVideo = this.changeVideo.bind(this);
        this.activateVideo = this.activateVideo.bind(this);
        this.deActivateVideo = this.deActivateVideo.bind(this);
        var th = this;
        setTimeout(() => {
            th.setState({})
        }, 20000);
        console.log("state is ----------------------- ", this.state)
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
        //initialize chime
        if (this.state.test == false) {
            meetingSession = chimeFunctios.initialize(this.state.meetingResponse, this.state.attendeeResponse, this);
            const res = await chimeFunctios.configureAudioFunction(meetingSession, 'myAudio');
            if (res.sucess == false) {
                alert(res.message);
                console.log(res.message);
            }
            const resVideo = await chimeFunctios.configureVideoFunction(meetingSession, 'myAudio');
            if (resVideo.sucess == false) {
                alert(resVideo.message);
                console.log(resVideo.message);
            }
            this.AddObserver(meetingSession);
            chimeFunctios.subscribeToMessages(meetingSession, this);
        }


    }
    AddObserver(meetingSession) {
        const observer = {
            // videoTileDidUpdate is called whenever a new tile is created or tileState changes.
            videoTileDidUpdate: tileState => {
                // alert("---------------------------------- ");

                // Ignore a tile without attendee ID and other attendee's tile.
                if (!tileState.boundAttendeeId) {
                    return;
                }
                // const selfAttendeeId = meetingSession.configuration.credentials.attendeeId;
                // const modality = new DefaultModality(tileState.boundAttendeeId);
                // if (modality.base() === selfAttendeeId && modality.hasModality(DefaultModality.MODALITY_CONTENT)) {
                //     // don't bind one's own content
                //     return;
                // }
                if (videoFlag == false) {
                    videoFlag = true;
                    return
                }

                console.log("going to assigb video--------------------", tileState, " video flag is  ", videoFlag);
                if (tileState.boundVideoElement) {
                    var videoid = tileState.boundVideoElement.id;
                    var obj = tilesData.find(x => x.videoID === videoid);
                    if (obj) {
                        obj.tileNum = tileState.tileId;
                        obj.externalUser = tileState.boundExternalUserId;
                        obj.tileState = tileState;
                    }
                    else {
                        tilesData.push({
                            videoID: videoid,
                            tileNum: tileState.tileId,
                            externalUser: tileState.boundExternalUserId,
                            tileState: tileState
                        })

                    }
                }


                if (videoFlag)
                    var videoElement = this.acquireVideoElement(tileState.tileId, "sd");
                else
                    var videoElement = this.acquireVideoElement(tileState.tileId, "change");


                console.log("Video element is -----------------------------------  ", videoElement);
                // alert(tileState.tileId);
                meetingSession.audioVideo.bindVideoElement(tileState.tileId, videoElement);


            },
            videoTileWasRemoved: tileId => {
                this.releaseVideoElement(tileId);
            },
            audioVideoDidStop: sessionStatus => {
                const sessionStatusCode = sessionStatus.statusCode();
                if (sessionStatusCode === MeetingSessionStatusCode.AudioCallEnded) {
                    alert('The session has ended');
                    this.props.history.push(this.state.url);
                    console.log('The session has ended');
                } else {
                    console.log('Stopped with a session status code: ', sessionStatusCode);
                }
            }

        };
        // meetingSession.audioVideo.startVideoPreviewForVideoInput(document.getElementById('myVideoP'));

        meetingSession.audioVideo.addObserver(observer);
    }

    acquireVideoElement(tileId, flag) {

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
            if (flag == "change") {

                //chng 
                return videoElements[tileId - 1]
            } else {
                if (indexMap[i] === tileId) {

                    return videoElements[i];
                }
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
        // meetingSession.audioVideo.startLocalVideoTile();
        await chimeFunctios.configureVideoFunction(meetingSession, 'myAudio');
        videoFlag = true;
        var payload = {
            action: 'selfEnableVideo',
            attendeeId: this.state.defaultAttendeeID,
            attendeeName: this.state.defaultAttendeeName,
        };
        chimeFunctios.sendMessage(meetingSession, 'Actions', payload);

        //now chnges the icon
        var attendees = this.state.attendees;
        var attendee = attendees.find(x => x.id === this.state.defaultAttendeeID);
        attendee.display = true;
        this.setState({
            attendees: attendees
        });

    }
    deActivateVideo() {
        meetingSession.audioVideo.stopLocalVideoTile();
        var payload = {
            action: 'selfDisableVideo',
            attendeeId: this.state.defaultAttendeeID,
            attendeeName: this.state.defaultAttendeeName,
        };
        chimeFunctios.sendMessage(meetingSession, 'Actions', payload);
        //now chnges the icon
        var attendees = this.state.attendees;
        var attendee = attendees.find(x => x.id === this.state.defaultAttendeeID);
        attendee.display = false;
        this.setState({
            attendees: attendees
        });
    }

    EndMeeting() {
        // setdisplay(true);
        this.setState({ dislpay: true });
        var obj = {
            meetingName: this.state.meetingResponse.Meeting.MeetingId
        }
        axios.post(url + "endMeeting", obj).then(res => {
            this.setState({ dislpay: false });
            this.props.history.push(this.state.url)
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
            this.props.history.push(this.state.url)
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
    changeVideo(e) {
        let strin = e.target.id;
        var videoElementData = tilesData.find(x => x.videoID === strin);
        if (videoElementData) {
            this.setState({ videoText: false });
            setTimeout((() => {
                document.getElementById('commonText').innerHTML = videoElementData.externalUser;
                meetingSession.audioVideo.bindVideoElement(videoElementData.tileNum, document.getElementById("myVideo-common"));

            }), 2000)

        }



    }
    Mute() {
        chimeFunctios.mute(meetingSession)
    }
    unMute() {
        chimeFunctios.unMute(meetingSession);
    }
    MuteOthers(item) {
        var payload = {
            action: 'mute',
            attendeeId: item.id,
            attendeeName: item.title,
        };
        chimeFunctios.sendMessage(meetingSession, 'Actions', payload)
    }
    unMuteOthers(item) {

        var payload = {
            action: 'unMute',
            attendeeId: item.id,
            attendeeName: item.title,
        };
        chimeFunctios.sendMessage(meetingSession, 'Actions', payload)
    }
    activateVideoOthers(item) {
        var payload = {
            action: 'enableVideo',
            attendeeId: item.id,
            attendeeName: item.title,
        };
        chimeFunctios.sendMessage(meetingSession, 'Actions', payload)
    }
    deActivateVideoOthers(item) {

        var payload = {
            action: 'disableVideo',
            attendeeId: item.id,
            attendeeName: item.title,
        };
        chimeFunctios.sendMessage(meetingSession, 'Actions', payload)
    }
    async componentWillUpdate() {
        if (this.state.activateVideoByAdmin) {
            await this.activateVideo();
            this.setState({ activateVideoByAdmin: false });

        }
    }
    render() {
        // alert(this.state.test);
        if (this.state.test == false) {

            chimeFunctios.subscribeToAttendeeChanges(meetingSession, this.state.meetingResponse.Meeting.MeetingId, this);

        }

        // console.log("--------------------state i s-------------------- ", this.state);
        return (
            <React.Fragment>
                <audio id="myAudio"></audio>
                {this.state.dislpay ? <LoadingOutlined className="App-header" style={{ fontSize: 100, paddingTop: "22%" }} spin /> :
                    <div>  <nav class="navbar navbar-expand-lg navbar-light bg-light ">

                        <a class="navbar-brand" target="_blank" href="https://geniteam.com"><img width="100" height="30" src={logo} /></a>
                        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse" id="navbarNavDropdown">
                            <ul class="navbar-nav">
                                <li class="nav-item active">
                                    {this.state.admin ? <a class="nav-link" data-toggle="modal" data-target="#exampleModal" >Invite Others  </a> : null}

                                </li>
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle" id="navbarDropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        Video
                    </a>
                                    <div class="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                                        <a class="dropdown-item" onClick={this.activateVideo}>Enable Video</a>
                                        <a class="dropdown-item" onClick={this.deActivateVideo}>Disable Video</a>

                                    </div>
                                </li>
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle" id="navbarDropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        Audio
                    </a>
                                    <div class="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                                        <a class="dropdown-item" onClick={this.unMute}>Enable Audio</a>
                                        <a class="dropdown-item" onClick={this.Mute}>Disable Audio</a>

                                    </div>
                                </li>
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle" id="navbarDropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        Meeting
                    </a>
                                    <div class="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                                        {
                                            this.state.admin ? <a class="dropdown-item" onClick={this.EndMeeting}>End Meeting</a> : <a class="dropdown-item" onClick={this.leaveMeeting}>Leave Meeting</a>
                                        }



                                    </div>
                                </li>
                            </ul>
                        </div>
                    </nav>



                        <Row className="mainVideoRow"
                        // style={{ height: window.screen.availHeight - 165 }}
                        >
                            <Col span={18} className="mainVideoColOne">

                                {this.state.videoText ?
                                    <p className='videoText'>Click on any video in order to see it in this screen</p>
                                    : <div><h1 id='commonText'></h1><video id="myVideo-common" width="100%" height="100%"></video></div>
                                }
                                {/* {
                                <Row className="secondVideoRow" >
                                    <Col className="secondVideoCol" span={8}>
                                        <a onClick={this.changeVideo}>
                                            <video id="myVideo-1" className='videosElement' ></video>
                                        </a> </Col>
                                    <Col className="secondVideoCol" span={8}>
                                        <a onClick={this.changeVideo}>
                                            <video id="myVideo-2" className='videosElement'></video>
                                        </a> </Col>
                                    <Col className="secondVideoCol" span={8}>
                                        <a onClick={this.changeVideo}>
                                            <video id="myVideo-3" className='videosElement'></video>
                                        </a> </Col>
                                </Row><Row>
                                    <Col className="secondVideoCol" span={3}>
                                        <a onClick={this.changeVideo}>
                                            <video id="myVideo-4" className='videosElement'></video>
                                        </a> </Col>
                                    <Col className="secondVideoCol" span={3}>
                                        <a onClick={this.changeVideo}>
                                            <video id="myVideo-5" className='videosElement'></video>
                                        </a> </Col>
                                    <Col className="secondVideoCol" span={3}>
                                        <a onClick={this.changeVideo}>
                                            <video id="myVideo-6" className='videosElement'></video>
                                        </a> </Col>
                                </Row><Row>
                                    <Col className="secondVideoCol" span={3}>
                                        <a onClick={this.changeVideo}>
                                            <video id="myVideo-7" className='videosElement'></video>
                                        </a> </Col>
                                    <Col className="secondVideoCol" span={3}>
                                        <a onClick={this.changeVideo}>
                                            <video id="myVideo-8" className='videosElement'></video>
                                        </a> </Col>
                                </Row>

     } */}


                            </Col>
                            <Col span={6} className="mainVideoColTwo">
                                <List
                                    itemLayout="vertical"
                                    dataSource={this.state.attendees}
                                    renderItem={item => (
                                        <List.Item>
                                            <Row>
                                                <Col span={12} >
                                                    <span className="avatar">{item.title[0]}{item.title[1]}<span
                                                        className="status online"></span></span>{' '}
                                                    <span className="avatarText">{item.isAdmin ? item.title + ' (Host)' : item.title}</span></Col>
                                                <Col span={4}></Col>
                                                <Col span={6}>

                                                    {
                                                        item.title === this.state.defaultAttendeeName
                                                            ?
                                                            (item.display == true ?
                                                                <a onClick={this.deActivateVideo} ><EyeOutlined className='flaot-right' /></a> :
                                                                <a onClick={this.activateVideo}><EyeInvisibleFilled className='flaot-right' /></a>)
                                                            : (this.state.admin ? (item.display == true ? <a onClick={() => this.deActivateVideoOthers(item)} ><EyeOutlined className='flaot-right' /></a> :
                                                                <a onClick={() => this.activateVideoOthers(item)}><EyeInvisibleFilled className='flaot-right' /></a>) :
                                                                (item.display == true ? <EyeOutlined className='flaot-right' /> :
                                                                    <EyeInvisibleFilled className='flaot-right' />))
                                                    }
                                                    {
                                                        item.title === this.state.defaultAttendeeName
                                                            ?
                                                            (item.mute == true ?
                                                                <a onClick={this.unMute} ><AudioMutedOutlined /></a> :
                                                                <a onClick={this.Mute}><AudioOutlined /></a>)
                                                            : (this.state.admin ? (item.mute == true ? <a onClick={() => this.unMuteOthers(item)} ><AudioMutedOutlined /></a> :
                                                                <a onClick={() => this.MuteOthers(item)}><AudioOutlined /></a>) :
                                                                (item.mute == true ? <AudioMutedOutlined /> :
                                                                    <AudioOutlined />))
                                                    }

                                                </Col>
                                            </Row>
                                        </List.Item>
                                    )}
                                />

                            </Col>
                        </Row>
                        {/* for all small videos */}
                        <Row className="secondVideoRow" >
                            <Col className="secondVideoCol" span={3}>
                                <a onClick={this.changeVideo}>
                                    <video id="myVideo-1" width="100%" height="100%" ></video>
                                </a> </Col>
                            <Col className="secondVideoCol" span={3}>
                                <a onClick={this.changeVideo}>
                                    <video id="myVideo-2" width="100%" height="100%"></video>
                                </a> </Col>
                            <Col className="secondVideoCol" span={3}>
                                <a onClick={this.changeVideo}>
                                    <video id="myVideo-3" width="100%" height="100%"></video>
                                </a> </Col>
                            <Col className="secondVideoCol" span={3}>
                                <a onClick={this.changeVideo}>
                                    <video id="myVideo-4" width="100%" height="100%"></video>
                                </a> </Col>
                            <Col className="secondVideoCol" span={3}>
                                <a onClick={this.changeVideo}>
                                    <video id="myVideo-5" width="100%" height="100%"></video>
                                </a> </Col>
                            <Col className="secondVideoCol" span={3}>
                                <a onClick={this.changeVideo}>
                                    <video id="myVideo-6" width="100%" height="100%"></video>
                                </a> </Col>
                            <Col className="secondVideoCol" span={3}>
                                <a onClick={this.changeVideo}>
                                    <video id="myVideo-7" width="100%" height="100%"></video>
                                </a> </Col>
                            <Col className="secondVideoCol" span={3}>
                                <a onClick={this.changeVideo}>
                                    <video id="myVideo-8" width="100%" height="100%"></video>
                                </a> </Col>
                        </Row></div>

                }
                {this.state.admin ? <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="exampleModalLabel">{this.state.meetingName}</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                Share this Id with your members
                                <br /> {this.state.meetingResponse.Meeting.MeetingId}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                {/* <button type="button" class="btn btn-primary">Save changes</button> */}
                            </div>
                        </div>
                    </div>
                </div> : null}

            </React.Fragment>


        );
    }
}

export default Meeting;
