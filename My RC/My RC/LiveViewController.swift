//
//  LiveViewController.swift
//  My RC
//
//  Created by Viet Tien on 4/17/19.
//  Copyright © 2019 Viet Tien. All rights reserved.
//

import UIKit
import CoreMotion
import Starscream
import MJPEGStreamLib
import CDJoystick
import LMGaugeViewSwift



class LiveViewController: UIViewController, WebSocketDelegate {
    
    @IBOutlet var videoView: UIImageView!
    @IBOutlet var Steer: UISlider!
    @IBOutlet var imgConnection: UIImageView!
    @IBOutlet weak var btnConnect: UIButton!
    @IBOutlet weak var btnHorn: UIButton!
    @IBOutlet weak var btnAcc: UIButton!
    
    @IBOutlet weak var btnRev: UIButton!
    
    @IBOutlet weak var Gauge: GaugeView!
    @IBOutlet weak var joystick: CDJoystick!
    @IBOutlet weak var ActivityIndicator: UIActivityIndicatorView!
    @IBOutlet weak var RightJoystick: CDJoystick!
    
    var motion = CMMotionManager()
    var stream: MJPEGStreamLib!
    var socket: WebSocket!
    var isConnected = false;
    
    var speed = 0 //0->100
    var steer = 50 //0->100
    var cameraH = 50 //0->100
    var cameraV = 50 //0->100
    
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {return .landscapeRight}
    override var shouldAutorotate: Bool {return true}
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        stream = MJPEGStreamLib(imageView: videoView)
        stream.didStartLoading = { [unowned self] in
            self.ActivityIndicator.startAnimating()
        }
        // Stop Loading Indicator
        stream.didFinishLoading = { [unowned self] in
            self.ActivityIndicator.stopAnimating()
        }
        motion.deviceMotionUpdateInterval = 0.1
        joystick.trackingHandler = { joystickData in
            self.LeftJoystickHandler(x: joystickData.velocity.x, y: joystickData.velocity.y)
        }
        
        RightJoystick.trackingHandler = { joystickData in
            self.RightJoystickHandler(x: joystickData.velocity.x, y: joystickData.velocity.y)
        }
        Gauge.minValue = 0
        Gauge.maxValue = 100
    }
    
    @IBAction func Connect(_ sender: Any) {
        if !isConnected{
            
            let defaults = UserDefaults.standard
            var pi = defaults.string(forKey: "pi") ?? "pirc.local"
            
            let alert = UIAlertController(title: "Connect to Pi RC car", message: "Input the address", preferredStyle: .alert)
            
            alert.addTextField { (textField:UITextField) in
                textField.placeholder = "Raspberry IP"
                textField.keyboardType = .numbersAndPunctuation
                textField.text = pi
            }
            alert.addAction(UIAlertAction(title: "Connect", style: .default, handler: {action in
                pi = alert.textFields?[0].text ?? ""
                self.socket = WebSocket(request: URLRequest(url: URL(string: "ws://\(pi):3000")!))
                self.socket.delegate = self
                self.socket.connect()
                defaults.set( pi, forKey: "pi")
            }))
            alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
            
            self.present(alert, animated: true)
        }
        else{
            let alert = UIAlertController(title: "Disconnect", message: "Do you want to disconnect", preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default, handler: {action in
                self.socket.disconnect()
                self.stream.stop()
                self.videoView.isHidden = true
                //Disconnect stream here
            }))
            alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
            self.present(alert, animated: true)
        }
    }
    
    func didReceive(event: Starscream.WebSocketEvent, client: Starscream.WebSocketClient) {
        switch event {
        case .connected(_):
            isConnected = true
            print("Websocket Connected")
            sendData(data: "hello")
            
        case .disconnected(let reason, let code):
            isConnected = false
            DisconnectHandler()
            print("Websocket disconnected: \(reason) with code: \(code)")
            
        case .text(let string):
            let data = Data(string.utf8)
            do {
                // make sure this JSON is in the format we expect
                if let json = try JSONSerialization.jsonObject(with: data, options: [])as? [String: Any]  {
                    InitViews(data: json)
                }
            } catch let error as NSError {
                print("Failed to load: \(error.localizedDescription)")
            }
            
        case .binary(let data):
            print("Received data: \(data)")
            
        case .ping(_):
            break
        case .pong(_):
            break
        case .viabilityChanged(_):
            break
        case .reconnectSuggested(_):
            break
        case .cancelled:
            isConnected = false
            DisconnectHandler()
            //motion.stopDeviceMotionUpdates()
            print("Websocket canceled")
        case .error(_):
            isConnected = false
        DisconnectHandler()
        case .peerClosed:
            isConnected = false
            DisconnectHandler()
            //motion.stopDeviceMotionUpdates()
            print("Websocket canceled")
        }
    }
    
    
    func InitViews(data: [String: Any]) {
        btnConnect.setImage(UIImage(named: "connected"), for: .normal)
        if let buzzer = data["buzzer"] as? Int
        {
            self.btnHorn.isHidden = !(buzzer == 1)
        }
        if let speed_control = data["speed_control"] as? Int
        {
            joystick.isHidden = !(speed_control == 1)
            Gauge.isHidden = !(speed_control == 1)
            btnAcc.isHidden = (speed_control == 1)
            btnRev.isHidden = (speed_control == 1)
            MotionHandler()
        }
        if let camera_servo = data["camera_servo"] as? Int
        {
            RightJoystick.isHidden = !(camera_servo == 1)
        }
        
        //"http://\(pi_address):8001/stream.mjpg")
        if let camera_stream = data["camera_stream"] as? String
        {
            if (camera_stream.contains("%@"))
            {
            let defaults = UserDefaults.standard
            let pi_address = defaults.string(forKey: "pi") ?? "myrc"// pi address
                let url = String(format:camera_stream, pi_address)
                videoView.isHidden = false
                print("Camera stream: " + url)
                stream.contentURL = URL(string: url)
                stream.play()
            }
            else
            {
                print("Invalid camera stream format")
            }
        }
        else
        {
            print("No camera_stream defined")
        }
        
    }
    
    func DisconnectHandler()  {
        print("Disconnected")
        if joystick.isHidden{//driving by gyro
            motion.stopDeviceMotionUpdates()
        }
        btnConnect.setImage(UIImage(named: "disconnect"), for: .normal)
        btnHorn.isHidden = true
        btnAcc.isHidden = true
        btnRev.isHidden = true
        joystick.isHidden = true
        Gauge.isHidden = true
        RightJoystick.isHidden = true
        
        
    }
    
    func MotionHandler(){
        motion.startDeviceMotionUpdates(to: OperationQueue.current!) { (data, error) in
            if let data = data{
                var new_steer =  Int(data.attitude.pitch * 90) + 50
                if new_steer > 100{
                    new_steer = 100
                }
                if new_steer < 0{
                    new_steer = 0
                }
                if abs(self.steer - new_steer) > 6{
                    if new_steer > 45 && new_steer < 55
                    {
                        new_steer = 50
                    }
                    self.steer = new_steer
                    self.sendData(data: "steer " + String(new_steer))
                }
            }
        }
    }
    
    func LeftJoystickHandler(x: CGFloat, y: CGFloat)
    {
        var new_speed = Int(y * -100)
        if new_speed > 95
        {    new_speed = 100}
        if new_speed < -95
        {   new_speed = -100}
        if new_speed < 5 && new_speed > -5
        {   new_speed = 0}
        if abs(speed - new_speed) > 5
        {
            speed = new_speed
            if speed < 0{
                speed = speed / 2 //reduce speed for better handling
                self.sendData(data: "rev " + String( -speed))
            }
            else if speed > 0
            {
                self.sendData(data: "acc " + String(speed))
            }
            else
            {
                self.sendData(data: "stop")
            }
            Gauge.value = Double(abs(speed))
        }
        
//        var new_steer =  Int(x * 50) + 50
//        if new_steer > 95{
//            new_steer = 100}
//        if new_steer < 5{
//            new_steer = 0}
//        if new_steer > 40 && new_steer < 60{
//            new_steer = 50}
//        
//        if abs(self.steer - new_steer) > 4
//        {
//            steer = new_steer
//            print(new_steer)
//            self.sendData(data: "steer " + String(steer))
//        }
    }
    
    func RightJoystickHandler(x: CGFloat, y: CGFloat)
    {
        var new_cameraH =  Int(-x * 50) + 50
        if new_cameraH > 95{
            new_cameraH = 100}
        if new_cameraH < 5{
            new_cameraH = 0}
        if new_cameraH > 40 && new_cameraH < 60{
            new_cameraH = 50}
        if abs(self.cameraH - new_cameraH) > 3
        {
            cameraH = new_cameraH
            print(new_cameraH)
            self.sendData(data: "cam_h " + String(cameraH))
        }
        
        var new_cameraV =  Int(-y * 50) + 50
        if new_cameraV > 95{
            new_cameraV = 100}
        if new_cameraV < 5{
            new_cameraV = 0}
        if new_cameraV > 40 && new_cameraV < 60{
            new_cameraV = 50}
        if abs(self.cameraV - new_cameraV) > 3
        {
            cameraV = new_cameraV
            print(new_cameraH)
            self.sendData(data: "cam_v " + String(cameraV))
        }
    }
    @IBAction func Accelate_stop(_ sender: Any) {
        if socket != nil && isConnected{
            socket.write(string: "stop")
        }
    }
    
    @IBAction func Accelate(_ sender: Any) {
        if socket != nil && isConnected{
            socket.write(string: "acc 100")
        }
    }
    
    @IBAction func Reverse(_ sender: Any) {
        if socket != nil && isConnected{
            socket.write(string: "rev 100")
        }
    }
    
    @IBAction func Reverse_stop(_ sender: Any) {
        if socket != nil && isConnected{
            socket.write(string: "stop")
        }
    }
    
    
    func sendData(data: String){
        print("Send data:", data)
        if socket != nil && isConnected{
            socket.write(string: data)}
        else{
            print("Socket closed")}
    }
    
    @IBAction func Horn_on(_ sender: Any) {
        if socket != nil && isConnected{
            socket.write(string: "buzzer 2000")
        }
    }
    
    @IBAction func Horn_off(_ sender: Any) {
        if socket != nil && isConnected{
            socket.write(string: "buzzer 0")
        }
    }
    
    
    
        
}
