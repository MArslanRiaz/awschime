import React, { useState } from 'react';

import { Input, Button, Row, Col } from 'antd'
import axios from 'axios';
import 'antd/dist/antd.css'
import { url } from "../config"
import { LoadingOutlined, UploadOutlined, MailOutlined, UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

function Dashbaord(props) {
    const [name, setName] = useState("");
    const [meetingName, setMeetingName] = useState("");
    const [display, setdisplay] = useState(false)
    return (

        <div className="App-header">

            <Row>
                <Col></Col>
                <Col>
                    {display ? <LoadingOutlined style={{ fontSize: 100, paddingLeft: "42%" }} spin /> : (
                        <div>
                            <a href="#" id="userSettings" className="user-settings" data-toggle="dropdown"
                                aria-haspopup="true">




                            </a>
                            <Row><Col> <h2 className="textWhite">Create A New Meeting</h2></Col></Row>
                            <Row><Col className="dashboardInput" > <Input onChange={e => setMeetingName(e.target.value)} placeholder=" Enter Meeting Name" /></Col></Row>
                            <Row><Col className="dashboardInput" > <Input onChange={e => setName(e.target.value)} placeholder=" Enter you name" /></Col></Row>
                            <Row>
                                <Col span="md-2">  <Button onClick={() => CreateMeeting()}>Create Meeting</Button></Col></Row>
                            <Row><Col><p><a className="dashboardRef" href="/join">Click here to join a mmeeting</a></p></Col></Row>
                        </div>)}


                </Col>

                <Col></Col>
            </Row>


        </div>
    );
    function CreateMeeting(e) {
        setdisplay(true);
        var obj = {
            name: name,
            meetingName: meetingName,
        }
        console.log("obj is -------------------", obj);
        axios.post(url + 'createMeeting', obj).then(res => {
            console.log("the resp is ----------------------------", res);
            res.data.meetingName = meetingName;
            res.data.admin = true
            var resp = JSON.stringify(res.data);
            localStorage.setItem("meeting", resp);
            // localStorage.setItem("admin", true);
            props.history.push("/meeting");
        }).catch(err => {
            setdisplay(false);
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
}

export default Dashbaord;
