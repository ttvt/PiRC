#!/bin/bash
###variable here

echo '+-----------------------------------------+'
echo '|        Raspberry Pi Zero Setup          |'
echo '|         For clean install only          |'
echo '+-----------------------------------------+'

 
echo 'Upgrading Pi packages...'
cd ~
sudo apt-get update -y
sudo apt-get upgrade -y


echo 'Set timezone and locale...'
sudo timedatectl set-timezone Asia/Ho_Chi_Minh
# if ! grep -qs "LANGUAGE=en_US.UTF-8" ~/.bashrc; then
# 	echo 'Setting locale...'
# 	echo "export LANG=en_US.UTF-8" >> ~/.bashrc
# 	echo "export LC_ALL=en_US.UTF-8" >> ~/.bashrc
# 	echo "export LANGUAGE=en_US.UTF-8" >> ~/.bashrc
# 	export LANG=en_US.UTF-8
# 	export LC_ALL=en_US.UTF-8
# 	export LANGUAGE=en_US.UTF-8
# 	sudo locale-gen "en_US.UTF-8"
# 	sudo update-locale
# fi


echo '---------- Install Python Camera -----------'
sudo apt-get install python3-pip python3-picamera


echo '-----Install Wiring PI 2.61 & PiGPIO--------'
if which gpio > /dev/null; then
    echo 'Wiring PI is already installed. Will skip...'
else
    sudo apt-get install pigpio wiringpi git -y #must install wiringpi from repo first
    git clone https://github.com/WiringPi/WiringPi.git
    cd WiringPi
    ./build.sh
    cd ~
fi


echo '--------------Node JS 11.15.0----------------'
if which node > /dev/null; then
    echo 'NodeJS is already installed. Will skip...'
else
    #Latest NodeJS for Pi Zero W: 11.15.0
    wget https://nodejs.org/download/release/v11.15.0/node-v11.15.0-linux-armv6l.tar.xz
    #wget https://unofficial-builds.nodejs.org/download/release/v16.13.2/node-v16.13.2-linux-armv6l.tar.xz
    sudo tar xJvf ./node-*-linux-*.tar.xz --strip=1 -C /usr/local
    sudo npm install -g  forever forever-service npm-upgrade 
fi

echo '--------------Setup npm modules-------------'
cd ~/my-rc/receiver/
npm install



echo '-------------Post setup config--------------'
echo 'Remove unnecessary packages...'
sudo apt-get remove -y dphys-swapfile
sudo update-rc.d nfs-common disable
sudo update-rc.d alsa-utils disable
sudo update-rc.d dphys-swapfile disable

sudo apt-get autoremove -y

echo '-------------Cleanning up files--------------'
cd ~
rm -f ~/node-*-linux-*.tar.xz
rm -rf ~/WiringPi

echo '-------------Auto run enable --------------'
sudo forever-service install nodeService
## Camera streaming from python app
if ! grep "camera.py" /etc/profile; then
    sudo bash -c 'echo "if [ \"\$SSH_CONNECTION\" != \"\" ]; then" >> /etc/profile' 
    sudo bash -c 'echo "     echo SSH Session login." >> /etc/profile'
    sudo bash -c 'echo "     return" >> /etc/profile'
    sudo bash -c 'echo "else" >> /etc/profile'
    sudo bash -c 'echo "     python3 /home/pi/my-rc/util/camera.py &" >> /etc/profile' 
    sudo bash -c 'echo "fi" >> /etc/profile'

    echo "/etc/profile modified. You must enable auto login in order camera to work"
fi




echo 'Completed. Should start node app.js for testing first'


