from gpiozero import Servo
from time import sleep

servo = Servo(14)

try:
  while True:
    print("Mid")
    servo.mid()
    sleep(2)
    print("Min")
    servo.min()
    sleep(2)
    print("max")
    servo.max()
    sleep(2)
except KeyboardInterrupt:
  print("Program stopped")
