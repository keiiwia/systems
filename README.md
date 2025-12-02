# systems--an in-progress ideation

## this doc is for assignment 5 -- tech sheet for Core Lab + Studio Final: Future as Systems

### ideation and prototype
My Futures as Systems project revolves around innovation, history, technological advancement, and humans acting as gods. Technology has written our world's history in blood and prejudice, and there are countless bioengineered/technological innovations built on oppression and taking advantage of minority/oppressed groups. It is important to wonder not just if we *can* achieved a scientific breakthrough, but also *if* we should be striving for that in the first place. 

As humans utilizing science, we have began playing God, fueled by greed and the need for power and control. We bend the world to our whims, and we've workshopped natural processes to fit exactly as we see fit.

On the "Operation" board, each piece that is inserted into the character represents an aspect of "godhood" we as humans have forcibly inserted into our lives/lifestyles/environments. As the user plays around with the objects, taking them in and out of the body, just as a surgeon "plays god" with the human body, bending the natural laws set in place by the universe. 


### technical materials and software
I plan on using both hardware and software together, where the interactions take place in the physical object, but the responses occur in the software/on the computer. I plan on using an **Arduino for all circuits**, with either **light sensors, or simple circuit completion** for the signals that will be sent through serial port into the computer. My preliminary idea used NFC tags and a mini NFC tag reader, but I have pivoted away from that idea for this project specifically, and may implement similar ideas in other future projects. 

In terms of software, I will be using **Javascript, Arduino, C++, and Node.js** for server/serial control. I will be using Arduino's [IoT Cloud JS Library](https://docs.arduino.cc/arduino-cloud/guides/javascript/) for the serial connection between hardware and software. 

Considering the physical aspect of my project, I am refurbishing an old 1999 "Operation" board game for the outer shell, utilizing the plastic pieces that fit into each slot in the board game's character. If there are any missing, I can simply 3-D print them with the right dimensions using filament/PVA, and it will function the same.

### documentation
The final submission will include the **"Operation" board**, **a working computer connected to the wifi**, **a website that contains all the visual feedback**, and the **Arduino/boards connected to the computer via serial port**. 

I will have three forms of documentation: video of users demonstrating/playing with my project, still photos of my project, and in-progress images. 

### discussion topics
The main points of inquiry I have are with the serial port connection and emulating the popup windows. I want the popup windows to look like an actual macOS window popup, and I'm not sure if there's something that's natively in the macOS development that I can use, or if I should just emulate it with JS in the website. 

Additionally, I'm a little unsure about the serial port-to-website connection, and how the logic of that should entirely run. Right now, I imagine it to be like this: 

*Sensor/Circuit Disrupted -> Arduino -> Serial Port -> IoT Cloud Library -> Local Server -> Website*

Looking over the Arduino forums/documentation, this seems to be how it works, but I'd love to discuss further about the technical aspect/details with this aspect of my project. 

