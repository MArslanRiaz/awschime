import React, { useState } from 'react';

import { Input, Button, Row, Col } from 'antd'
import axios from 'axios';
import 'antd/dist/antd.css'
import { url } from "../config"
import { LoadingOutlined, UploadOutlined, MailOutlined, UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

function JoinMeeting(props) {
    const [name, setName] = useState("");
    const [meetingName, setMeetingName] = useState("");
    const [display, setdisplay] = useState(false)
    return (

        <div className="App-header">
            <header >
                <Row>
                    <Col></Col>
                    <Col>
                        {display ? <LoadingOutlined style={{ fontSize: 100, paddingLeft: "42%" }} spin /> : (
                            <div>
                                <Row><Col> <h2 className="textWhite">Enter Meeting Code</h2></Col></Row>
                                <Row><Col className="dashboardInput" > <Input onChange={e => setMeetingName(e.target.value)} placeholder=" Enter Meeting Code" /></Col></Row>
                                <Row><Col className="dashboardInput" > <Input onChange={e => setName(e.target.value)} placeholder=" Enter you name" /></Col></Row>
                                <Row>
                                    <Col span="md-2">  <Button onClick={() => JoinMeeting()}>Join Meeting</Button></Col></Row>
                                <Row><Col><p><a className="dashboardRef" href="/">Click here to create a mmeeting</a></p></Col></Row>
                            </div>)}


                    </Col>

                    <Col></Col>
                </Row>

            </header>
        </div>
    );
    function JoinMeeting(e) {
        setdisplay(true);
        var obj = {
            name: name,
            meetingId: meetingName,
        }
        console.log("obj is -------------------", obj);
        axios.post(url + 'JoinMeeting', obj).then(res => {
            console.log("the resp is ----------------------------", res);
            res.data.meetingName = meetingName;
            res.data.admin = false;
            var resp = JSON.stringify(res.data);
            localStorage.setItem("meeting", resp);
            // localStorage.setItem("admin", false);
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

export default JoinMeeting;
