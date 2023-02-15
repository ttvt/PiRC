
const tone = require('./tone');
const setting = require('./setting');
var Gpio = require('pigpio').Gpio;
const readline = require('readline-sync');


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
  	l298n.setSpeed(l298nModule.LEFT, 60);
  	l298n.forward(l298nModule.LEFT);  
  	console.log("Direction = FORWARD 1");
  	sleep(1000);
  	l298n.stop(l298nModule.LEFT);
	sleep(500);
  	  
	l298n.backward(l298nModule.LEFT);
  	console.log("Direction = BACKWARD 1");
  	sleep(1000);
  	l298n.stop(l298nModule.LEFT);
};


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

function SteeringServo()
{
	console.log("\nSteering Servo calibration");
	console.log("Step 1: Center Steering");
	const servo = new Gpio(setting.STEER_SERVO, 'out');
	var mid_pulse = setting.STEER_SERVO_MID_PULSE;
	var running = true
	while (running){
		console.log("Current Value: %d", mid_pulse);
		let new_value = readline.question("Enter new value. Enter to finish: ");
		if (new_value == "")
			running = false;
		else
		{
			mid_pulse =  Number(new_value);
			if ( !isNaN(mid_pulse) && mid_pulse >= 500 && mid_pulse <= 2500)
			{
				servo.servoWrite(mid_pulse);
				sleep(500);
				TestL298n();
			}	
		}
	}
	console.log("\nStep 2: Minimum Pulse (Left Angle)");
	running = true;
	var min_pulse = setting.STEER_SERVO_MIN_PULSE;
	while (running){
		console.log("Current Value: %d", min_pulse);
		let new_value = readline.question("Enter new value. Enter to finish: ");
		if (new_value == "")
			running = false;
		else
		{
			min_pulse =  Number(new_value);
			if ( !isNaN(min_pulse) && min_pulse >= 500 && min_pulse <= 2500)
			{
				servo.servoWrite(min_pulse);
				sleep(2000);
				servo.servoWrite(mid_pulse);
				
			}	
		}
	}

	console.log("\Step 3: Maximum Pulse (Right Angle)");
	running = true;
	var max_pulse = setting.STEER_SERVO_MAX_PULSE;
	while (running){
		console.log("Current Value: %d", max_pulse);
		let new_value = readline.question("Enter new value. Enter to finish: ");
		if (new_value == "")
			running = false;
		else
		{
			max_pulse =  Number(new_value);
			if ( !isNaN(max_pulse) && max_pulse >= 500 && max_pulse <= 2500)
			{
				servo.servoWrite(max_pulse);
				sleep(2000);
				servo.servoWrite(mid_pulse);
				
			}	
		}
	}
	console.log("\nResult: min pwm: %d; mid pwm: %d; max pwm: %d", min_pulse, mid_pulse, max_pulse);
}

function CameraVServo()
{
	console.log("\nCamera Horizonal Servo calibration");
	console.log("Step 1: Center Camera");
	const servo = new Gpio(setting.CAM_V_SERVO, 'out');
	var mid_pulse = setting.CAM_V_SERVO_MID_PULSE;
	var running = true
	while (running){
		console.log("Current Value: %d", mid_pulse);
		let new_value = readline.question("Enter new value. Enter to finish: ");
		if (new_value == "")
			running = false;
		else
		{
			mid_pulse =  Number(new_value);
			if ( !isNaN(mid_pulse) && mid_pulse >= 500 && mid_pulse <= 2500)
				servo.servoWrite(mid_pulse);
		}
	}
	console.log("\nStep 2: Minimum Pulse (Low Angle)");
	running = true;
	var min_pulse = setting.CAM_V_SERVO_MIN_PULSE;
	while (running){
		console.log("Current Value: %d", min_pulse);
		let new_value = readline.question("Enter new value. Enter to finish: ");
		if (new_value == "")
			running = false;
		else
		{
			min_pulse =  Number(new_value);
			if ( !isNaN(min_pulse) && min_pulse >= 500 && min_pulse <= 2500)
			{
				servo.servoWrite(min_pulse);
				sleep(2000);
				servo.servoWrite(mid_pulse);
				
			}	
		}
	}

	console.log("\Step 3: Maximum Pulse (High Angle)");
	running = true;
	var max_pulse = setting.CAM_V_SERVO_MAX_PULSE;
	while (running){
		console.log("Current Value: %d", max_pulse);
		let new_value = readline.question("Enter new value. Enter to finish: ");
		if (new_value == "")
			running = false;
		else
		{
			max_pulse =  Number(new_value);
			if ( !isNaN(max_pulse) && max_pulse >= 500 && max_pulse <= 2500)
			{
				servo.servoWrite(max_pulse);
				sleep(2000);
				servo.servoWrite(mid_pulse);
				
			}	
		}
	}
	console.log("\nResult: min pwm: %d; mid pwm: %d; max pwm: %d", min_pulse, mid_pulse, max_pulse);
}

function CameraHServo()
{
	console.log("\nCamera Horizonal Servo calibration");
	console.log("Step 1: Center Camera");
	const servo = new Gpio(setting.CAM_H_SERVO, 'out');
	var mid_pulse = setting.CAM_H_SERVO_MID_PULSE;
	var running = true
	while (running){
		console.log("Current Value: %d", mid_pulse);
		let new_value = readline.question("Enter new value. Enter to finish: ");
		if (new_value == "")
			running = false;
		else
		{
			mid_pulse =  Number(new_value);
			if ( !isNaN(mid_pulse) && mid_pulse >= 500 && mid_pulse <= 2500)
				servo.servoWrite(mid_pulse);
		}
	}
	console.log("\nStep 2: Minimum Pulse (Left Angle)");
	running = true;
	var min_pulse = setting.CAM_H_SERVO_MIN_PULSE;
	while (running){
		console.log("Current Value: %d", min_pulse);
		let new_value = readline.question("Enter new value. Enter to finish: ");
		if (new_value == "")
			running = false;
		else
		{
			min_pulse =  Number(new_value);
			if ( !isNaN(min_pulse) && min_pulse >= 500 && min_pulse <= 2500)
			{
				servo.servoWrite(min_pulse);
				sleep(2000);
				servo.servoWrite(mid_pulse);
				
			}	
		}
	}

	console.log("\Step 3: Maximum Pulse (Right Angle)");
	running = true;
	var max_pulse = setting.CAM_H_SERVO_MAX_PULSE;
	while (running){
		console.log("Current Value: %d", max_pulse);
		let new_value = readline.question("Enter new value. Enter to finish: ");
		if (new_value == "")
			running = false;
		else
		{
			max_pulse =  Number(new_value);
			if ( !isNaN(max_pulse) && max_pulse >= 500 && max_pulse <= 2500)
			{
				servo.servoWrite(max_pulse);
				sleep(2000);
				servo.servoWrite(mid_pulse);
				
			}	
		}
	}
	console.log("\nResult: min pwm: %d; mid pwm: %d; max pwm: %d", min_pulse, mid_pulse, max_pulse);
}


function Main()
{
	var running = true;
	while (running){
		console.log("\nServo Calibration. Select your servo:");
		console.log("1. Steering Servo");
		console.log("2. Camera Horizonal Servo");
		console.log("3. Camera Vertical Servo");
		//console.log("0. Exit");
		let response = readline.question("Enter your choice. Enter to exit: ");
		switch (response){
			case '1':
				SteeringServo();
				break;
			case '2':
				CameraHServo();
				break;
			case '3':
				CameraVServo();
				break;
			case '':
				running = false;
				break;
		}
	

	}
	

	

}
Main();
//TestL9110();
//TestL298n();
//TestSteerServo();
//TestCameraServo();
//TestBuzzer();
//TestLED();