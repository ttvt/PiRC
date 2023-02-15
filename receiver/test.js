
const tone = require('./tone');
const setting = require('./setting');
var Gpio = require('pigpio').Gpio;


const sleep = (milliseconds) => {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
};


function TestL298n() {
	const l298nModule = require("./motor-l298n");
	const l298n = l298nModule.setup(setting.L298_IN1, setting.L298_IN2, setting.L298_ENA, 
		setting.L298_IN3, setting.L298_IN4, setting.L298_ENA);	
	console.log("L298n Globals: LEFT=%d, RIGHT=%d", l298nModule.LEFT, l298nModule.RIGHT);
  	l298n.setSpeed(l298nModule.LEFT, 100);
  	console.log("Starting motor-l298n Test");
  	l298n.backward(l298nModule.LEFT);
  	console.log("Direction = BACKWARD 1");
  	sleep(2000);
  	l298n.forward(l298nModule.LEFT);  
  	console.log("Direction = FORWARD 1");
  	sleep(2000);
  	console.log("Speed test");
  	for (var i=10; i<= 100; i+= 10){
		l298n.setSpeed(l298nModule.LEFT, i);  
		console.log(i);
		sleep(1200);
  	}
  	l298n.stop(l298nModule.LEFT);
};

function TestL9110() {
	const l298nModule = require("./motor-l298n");
	const l298n = l298nModule.setup(setting.L298_IN1, setting.L298_IN2, setting.L298_ENA, 
		setting.L9110_INBA, setting.L9110_INBB, setting.L9110_ENB);	
	console.log("L9110 Globals: LEFT=%d, RIGHT=%d", l298nModule.LEFT, l298nModule.RIGHT);
  	l298n.setSpeed(l298nModule.LEFT, 100);
	l298n.setSpeed(l298nModule.RIGHT, 100);
	// console.log("Starting motor-l298n for L9110 Test");
  	
	// l298n.backward(l298nModule.LEFT);
  	// console.log("Direction = BACKWARD LEFT");
	// sleep(2000);

	// l298n.backward(l298nModule.RIGHT);
	// console.log("Direction = BACKWARD RIGHT");
	// sleep(2000);
	
  	l298n.forward(l298nModule.LEFT);  
  	console.log("Direction = FORWARD LEFT");
  	//sleep(2000);
	
	l298n.forward(l298nModule.RIGHT);  
  	console.log("Direction = FORWARD RIGHT");
  	//sleep(2000);
	for (var i=10; i<= 100; i+= 10){
		l298n.setSpeed(l298nModule.LEFT, i);
		l298n.setSpeed(l298nModule.RIGHT, i);  
		console.log(i);
		sleep(1200);
  	}

  	l298n.stop(l298nModule.LEFT);
	l298n.stop(l298nModule.RIGHT);
};

function TestSteerServo()
{
	const servo = new Gpio(setting.STEER_SERVO, 'out');
	console.log("Steering Servo Test");
	servo.servoWrite(setting.STEER_SERVO_MIN_PULSE);//500min
	sleep(3000);
	servo.servoWrite(setting.STEER_SERVO_MAX_PULSE);//2500max
	sleep(3000);
	servo.servoWrite((setting.STEER_SERVO_MIN_PULSE + setting.STEER_SERVO_MAX_PULSE) / 2);
}

function TestCameraServo()
{
	const servoH = new Gpio(setting.CAM_H_SERVO, 'out');
	console.log("Camera Servo Horizon Test");//midle 1450
	// for (var i=setting.CAM_H_SERVO_MIN_PULSE; i<= setting.CAM_H_SERVO_MAX_PULSE; i+= 100){
	// 	servoH.servoWrite(i);//500min
	// 	console.log(i);
	// 	sleep(800);
  	// }

	// servoH.servoWrite(setting.CAM_H_SERVO_MIN_PULSE);//500min
	// sleep(3000);
	// servoH.servoWrite(setting.CAM_H_SERVO_MAX_PULSE);//2500max
	// sleep(3000);
	servoH.servoWrite((setting.CAM_H_SERVO_MIN_PULSE + setting.CAM_H_SERVO_MAX_PULSE) / 2);
	sleep(3000);

	
	const servoV = new Gpio(setting.CAM_V_SERVO, 'out');
	console.log("Camera Servo Vertical Test");
	for (var i=setting.CAM_V_SERVO_MIN_PULSE; i<= setting.CAM_V_SERVO_MAX_PULSE; i+= 100){
		servoV.servoWrite(i);//500min
		console.log(i);
		sleep(800);
  	}
	// servoV.servoWrite(setting.CAM_V_SERVO_MIN_PULSE);
	// sleep(3000);
	// servoV.servoWrite(setting.CAM_V_SERVO_MAX_PULSE);
	// sleep(3000);
	servoV.servoWrite(setting.CAM_V_SERVO_MID_PULSE);

}

function TestBuzzer()
{
	var buzzer = new Gpio(setting.BUZZER, {mode: Gpio.OUTPUT});
	console.log("Buzzer test");
	buzzer.pwmWrite(127);
	for (var i = 200; i < 2000; i+=100)
	{
		console.log(i);
		buzzer.pwmFrequency(i);
		sleep(100);
	}
	buzzer.pwmWrite(0);
}

function TestLED()
{
	const led1 = new Gpio(setting.LED_LEFT, 'out');
	const led2 = new Gpio(setting.LED_RIGHT, 'out');
	let count = 0;
	let dutyCycle = 0;
	console.log("LED Test. Led LEFT");
	var id1 = setInterval(() => {
		led1.pwmWrite(dutyCycle);
		dutyCycle += 5;
		if (dutyCycle > 255) {
			dutyCycle = 0;
			count += 1;
		}
		if (count >= 10)
		{
			clearInterval(id1);
			led1.pwmWrite(0);
			count = 0;
			dutyCycle = 0;
			console.log("LED Test. Led RIGHT");
			var id2 = setInterval(() => {
				led2.pwmWrite(dutyCycle);
				dutyCycle += 5;
				if (dutyCycle > 255) {
					dutyCycle = 0;
					count += 1;
				}
				if (count >= 10)
				{
					clearInterval(id2);
					led2.pwmWrite(0);
				}
			}, 20);
		}
	}, 20);
}

//TestL9110();
//TestL298n();
//TestSteerServo();
TestCameraServo();
//TestBuzzer();
//TestLED();


