/*Copyright TTVTien @ 2021
Description: My sweet heart RC car
*/
require('dotenv').config();
//Settings file
const setting = require('./setting');
let express = require('express');
const { setegid, exit } = require('process');
let app = express();
let expressWs = require('express-ws')(app);
var Gpio = require('pigpio').Gpio;

var left_signal = true, right_signal = true;//flashing at initial
var led_dutyCycle = 1;
var current_speed = 0;
var moving = 0;
var idle_counter = 0;



if (process.env.HARDWARE){
    console.log("Setting up PiGPIO for servo, LED, Buzzer");
	var HbridgeModule = require("./motor-l298n");
    var HWdata = {
        speed_control: /^L298$/i.test(process.env.HARDWARE),
        camera_servo: /^true$/i.test(process.env.CAMERA_SERVO),
        buzzer: /^true$/i.test(process.env.BUZZER),
        camera_stream: process.env.CAMERA_STREAM
    }
    console.log(HWdata);

    if (/^L298$/i.test(process.env.HARDWARE)) {
        console.log("Setting up L298N and Steering Servo");
        var s_servo = new Gpio(setting.STEER_SERVO, {mode: Gpio.OUTPUT});
        var s_pulseMid = setting.STEER_SERVO_MID_PULSE;
        var s_pulseStepL = (setting.STEER_SERVO_MID_PULSE - setting.STEER_SERVO_MIN_PULSE) / 50;
        var s_pulseStepH = (setting.STEER_SERVO_MAX_PULSE - setting.STEER_SERVO_MID_PULSE) / 50;
        var hBridge = HbridgeModule.setup(setting.L298_IN1, setting.L298_IN2, setting.L298_ENA,
            setting.L298_IN3, setting.L298_IN4, setting.L298_ENB);   
    }
    else if (/^L9110$/i.test(process.env.HARDWARE)) {
        console.log("Setting up L9110");
        var hBridge = HbridgeModule.setup(setting.L9110_INAA, setting.L9110_INAB, setting.L9110_ENA,
            setting.L9110_INBA, setting.L9110_INBB, setting.L9110_ENB);
    }else{
        console.log("Unsupported hardware (L298 | L9110)", process.env.HARDWARE);
        exit(1);
    }    

    if (HWdata.camera_servo){
        console.log("Setting up Camera servo");
        var h_servo = new Gpio(setting.CAM_H_SERVO, {mode: Gpio.OUTPUT});
        var h_pulseMid = setting.CAM_H_SERVO_MID_PULSE;
        var h_pulseStepL = (setting.CAM_H_SERVO_MID_PULSE - setting.CAM_H_SERVO_MIN_PULSE) / 50;
        var h_pulseStepH = (setting.CAM_H_SERVO_MAX_PULSE - setting.CAM_H_SERVO_MID_PULSE) / 50;
        
        var v_servo = new Gpio(setting.CAM_V_SERVO, {mode: Gpio.OUTPUT});
        var v_pulseMid = setting.CAM_V_SERVO_MID_PULSE;
        var v_pulseStepL = (setting.CAM_V_SERVO_MID_PULSE - setting.CAM_V_SERVO_MIN_PULSE) / 50;
        var v_pulseStepH = (setting.CAM_V_SERVO_MAX_PULSE - setting.CAM_V_SERVO_MID_PULSE) / 50;
    }
    console.log("Setting up Led");
    var led_left = new Gpio(setting.LED_LEFT, 'out');
    var led_right = new Gpio(setting.LED_RIGHT, 'out');
    var buzzer = new Gpio(setting.BUZZER, {mode: Gpio.OUTPUT});

}

function Hello() {
    left_signal = false;
    right_signal = false;
    Buzzer(1000);
    if (HWdata.camera_servo)
    {
        Camera_H(0);
        Camera_V(0);
        setTimeout(function () {
            Camera_H(100);
            Camera_V(100);
            setTimeout(function () {
                Camera_H(50);
                Camera_V(50);
            },800);
        }, 800)
    }
    if (HWdata.speed_control){//l298 variants
       Steer(0);
        setTimeout(function () {
            Steer(100);
            Buzzer(2000);
            setTimeout(function () {
                Steer(50);
                Buzzer(0);
            },800);
        }, 800)
    }
    else
    {
        setTimeout(function () {
            Buzzer(0);
        }, 800)
    }

    var Ws = expressWs.getWss('/');
    Ws.clients.forEach(function (client) {
        client.send(JSON.stringify(HWdata));
      });
}

function Accelerate(data) {
    console.log("Accelerate %i%", data);
    if (data > 50 || HWdata.speed_control){//filter because L9110 dont have speed control
        if (moving != 1)
        {
            moving = 1;
            hBridge.forward(HbridgeModule.LEFT);
            hBridge.forward(HbridgeModule.RIGHT);
        }
        else{
            let new_speed = parseInt(data);
            if (new_speed != current_speed)
            {
                current_speed = new_speed;
            hBridge.setSpeed(HbridgeModule.LEFT, current_speed);
            }
        }
    }
}



function Reverse(data) {
    console.log("Reverse %i%", data);   
    if (data >25 || HWdata.speed_control){//filter because L9110 dont have speed control
    if (moving != -1)
    {
        moving = -1;
	    hBridge.backward(HbridgeModule.LEFT);
        hBridge.backward(HbridgeModule.RIGHT);
    }
    else{
        let new_speed = parseInt(data);
        if (new_speed != current_speed)
        {
            current_speed = new_speed;
            hBridge.setSpeed(HbridgeModule.LEFT, current_speed);
        }
    }
 }
}

function Stop() {
    console.log("Stop");
    moving = 0;
    hBridge.stop(HbridgeModule.LEFT);
    hBridge.stop(HbridgeModule.RIGHT);
}

//0<->100
function Steer(percent) {
    if (percent > 60){
        s_servo.servoWrite(s_pulseMid + (percent - 50) * s_pulseStepH);
        right_signal = true;
    }
    else if (percent <40)
    {
        s_servo.servoWrite(s_pulseMid + (percent - 50) * s_pulseStepL);
        left_signal = true;
    }
    else
    {
        s_servo.servoWrite(s_pulseMid);
        left_signal = false;
        right_signal = false;
    }
}


function Steer_L9110(percent) {
    console.log("Steering to: %i", percent);
    if (percent < 30) {
        left_signal = true;
        hBridge.backward(HbridgeModule.LEFT);
        hBridge.forward(HbridgeModule.RIGHT);

    } else if (percent > 70) {
        right_signal = true;
        hBridge.forward(HbridgeModule.LEFT);
        hBridge.backward(HbridgeModule.RIGHT);
    } else {
        left_signal = false;
        right_signal = false;
        hBridge.stop(HbridgeModule.LEFT);
        hBridge.stop(HbridgeModule.RIGHT);
    }
}


function Camera_H(percent) {
    if (percent > 60)
        h_servo.servoWrite(h_pulseMid + (percent - 50) * h_pulseStepH);
    else if (percent <40)
        h_servo.servoWrite(h_pulseMid + (percent - 50) * h_pulseStepL);
    else
        h_servo.servoWrite(h_pulseMid);
}

function Camera_V(percent) {
    if (percent > 60)
    {
        v_servo.servoWrite(v_pulseMid + (percent - 50) * v_pulseStepH + 50);
        v_servo.servoWrite(v_pulseMid + (percent - 50) * v_pulseStepH);
    }
    else if (percent <40)
        v_servo.servoWrite(v_pulseMid + (percent - 50) * v_pulseStepL);
    else
    {
        v_servo.servoWrite(v_pulseMid+50);
        v_servo.servoWrite(v_pulseMid);
    }
}




function Headlight(active) {
    console.log("Head light %s", active);
}

function Buzzer(freq) {
    console.log("Buzzer %s", freq);
    if (freq != 0){
        buzzer.pwmWrite(128);
        buzzer.pwmFrequency(freq);
    }
    else
        buzzer.pwmWrite(0);
}

function GetParam(msg)
{
    return msg.split(' ')[1];
}
//Web Socket for communicate with client OS
app.ws('/', function (ws, req) {
    ws.on('message', function (msg) {
        //console.log("Message: %s", msg);
        switch (true) {
            case /hello/.test(msg):
                Hello();
                break;
            case /acc/.test(msg):
                Accelerate(GetParam(msg));
                break;
            case /rev/.test(msg):
                Reverse(GetParam(msg));
                break;
            case /stop/.test(msg):
                Stop();   
                break;
            case /buzzer/.test(msg):
                Buzzer(GetParam(msg));
                break;
            case /headlight/.test(msg):
                Headlight(GetParam(msg));
                break;
            case /steer/.test(msg):
                if (process.env.HARDWARE == 'L298') 
                    Steer(GetParam(msg));
                else
                    Steer_L9110(GetParam(msg));
                break;
            case /cam_h/.test(msg):
                Camera_H(GetParam(msg));
                break;
            case /cam_v/.test(msg):
                Camera_V(GetParam(msg));
                break;
            default:
                break;
        }
    });
    ws.on('close', function(reason, desc) {
        left_signal = true;
        right_signal = true;
        console.log("Remote disconnected");
    });

});

function LEDDeamon()
{
	led_dutyCycle *=  2;
	if (led_dutyCycle > 250)
	{
		led_dutyCycle = 1;
	}
	if (left_signal)
	{
		led_left.pwmWrite(led_dutyCycle);
        if (right_signal)
        { 
            //idle_counter += 1; disable idle shutdown
            if (idle_counter == setting.idle_shutdown)
            {
                console.log("Idle shutdown");
                var exec = require('child_process').exec;
                exec('shutdown now', function(error, stdout, stderr){ callback(stdout); });
            }
        }
	}
	else
	{
        idle_counter = 0;
		led_left.pwmWrite(0);
	}
	if (right_signal)
	{
		led_right.pwmWrite(led_dutyCycle);
	}
	else
	{
        idle_counter = 0;
		led_right.pwmWrite(0);
	}

}

//API Listening
const port = setting.port;

if (process.env.HARDWARE)
    app.listen(port, () => {
        
        console.log(`App MyRC (NodeJS) started on port: ${port}`);
        setInterval(LEDDeamon, setting.led_interval);
    });
else
    console.log("Hardware not specify in environtment varialbe file.");