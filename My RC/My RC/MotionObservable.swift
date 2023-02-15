//
//  MotionObservable.swift
//  My RC
//
//  Created by Viet Tien on 4/19/19.
//  Copyright © 2019 Viet Tien. All rights reserved.
//


import Foundation
import CoreMotion

let Fps60 = 0.016

class MotionObservable {
    
    let motionManager: CMMotionManager
    let updateInterval: Double = Fps60
    
    var gyroObservers = [(Double, Double, Double) -> Void]()
    var accelerometerObservers = [(Double, Double, Double) -> Void]()
    
    // MARK: Public interface
    
    init() {
        motionManager = CMMotionManager()
        initMotionEvents()
    }
    
    func addGyroObserver(observer: @escaping (Double, Double, Double) -> Void) {
        gyroObservers.append(observer)
    }
    
    func addAccelerometerObserver(observer: @escaping (Double, Double, Double) -> Void) {
        accelerometerObservers.append(observer)
    }
    
    func clearObservers() {
        gyroObservers.removeAll()
        accelerometerObservers.removeAll()
    }
    
    // MARK: Internal methods
    
    private func notifyGyroObservers(x: Double, y: Double, z: Double) {
        for observer in gyroObservers {
            observer(x, y, z)
        }
    }
    
    private func notifyAccelerometerObservers(x: Double, y: Double, z: Double) {
        for observer in accelerometerObservers {
            observer(x, y, z)
        }
    }
    
    private func roundDouble(value: Double) -> Double {
        return round(1000 * value)/100
    }
    
    private func initMotionEvents() {
        if motionManager.isGyroAvailable || motionManager.isAccelerometerAvailable {
            motionManager.deviceMotionUpdateInterval = updateInterval;
            motionManager.startDeviceMotionUpdates()
        }
        
        
        // Gyro
        if motionManager.isGyroAvailable {
            motionManager.gyroUpdateInterval = updateInterval
            motionManager.startGyroUpdates(to: OperationQueue.current!, withHandler: { (gyroData: CMGyroData?, NSError) -> Void in
                let rotation = gyroData!.rotationRate
                let x = self.roundDouble(value: rotation.x)
                let y = self.roundDouble(value: rotation.y)
                let z = self.roundDouble(value: rotation.z)
                self.notifyGyroObservers(x: x, y: y, z: z)
                
                if (NSError != nil){
                    print("\(String(describing: NSError))")
                }
            })
        } else {
            print("No gyro available")
        }
        
        // Accelerometer
        if motionManager.isAccelerometerAvailable {
            motionManager.accelerometerUpdateInterval = updateInterval
            motionManager.startAccelerometerUpdates(to: OperationQueue.current!) { (accelerometerData: CMAccelerometerData?, NSError) -> Void in
                
                if let acceleration = accelerometerData?.acceleration {
                    let x = self.roundDouble(value: acceleration.x)
                    let y = self.roundDouble(value: acceleration.y)
                    let z = self.roundDouble(value: acceleration.z)
                    self.notifyAccelerometerObservers(x: x, y: y, z: z)
                }
                if(NSError != nil) {
                    print("\(String(describing: NSError))")
                }
            }
        } else {
            print("No accelerometer available")
        }
    }
}
