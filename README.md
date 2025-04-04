# self-track

A simple, secure and safe way to keep track of what you are working on when using your computer.

# Distributions

Current Version: 0.2.0

Obtainable from right here - https://github.com/MomoRazor/self-track/releases

So far tested on:

- Windows 11
- Ubuntu 24 LTS

### Have you run it on something else? Let us know how it went please <3!

https://github.com/MomoRazor/self-track/issues

# Why was this built

There are a multitude of tracking apps out there. All of which do a decent job at what they set out to do. However, it has always irked me that something as sensative as what I do on my computer, gets beamed up on the cloud, with only blind faith to hold on to the idea that that information is for my eyes only. Therefore, I set out to build a very simple tracking app, that keeps all data local ALWAYS, and can only distribute its findings if you do so manually. Apart from this, the app is also a 100% open source, so that the process is fully trustless and transparent.

Of course there are positives and negatives to this approach, and I will outline them here:

# Positives

- Security and Safety (as aforementioned)
- Growth - Given its open source nature, all the positives that come with open source projects are given to this app. Consistant updates, continuous feedback and fresh new ideas are all valid and encouraged ways to contribute to Self-Track.
- Unexploitable - Tracking Apps have a long history of being used by employers to micro-manage their employees, being annoying at best and exploitative at worst. With Self-Track, this is impossible, since the data Self-Track gathers will ALWAYS be available to you only, and will only be deliverable to someone else later.

## Negatives

- No Cloud Backup - Of course, keeping everything local does mean that your system is the one and only backup of your data. Users are responsible to backup their data elsewhere in the event of issues with the device, or the device in question becomes compromised in any way.
- No Auto Update - The application is forbidden from connecting online, and so it is impossible for it to check if newer version of Self-Track have been updated. We might release version where settings might allow the application to connect to the internet on user confirmation, but this is still in the works and will need careful consideration.

## How to use

All you have to do is download the corresponding .zip file to your platform, start recording, and go about your business.

Note: For Linux systems, specific permissions must be given to the current user in order for interactivity information to be tracked. This is requested when the program starts. Self-Track can work without it, but interactivity will not be tracked.

Data is stored in userData directory of your system, and it is easily reachable from within the Application for easy of use. This data is saved in a .xls file and can be browsed with any software that supports .XLS or .XLSX.

# Feedback and Contribution

Help us improve and extend Self-Track by logging bug reports here - https://github.com/MomoRazor/self-track/issues

# Current Roadmap

We always have ideas to make Self-Track better. Here is a short list of some of our ideas moving forward:

- Wayland window support (this will probably decrease significantly the list of softwares we cannot detect on Linux)
- Support for MacOS
- Settings section - This will allow:
  - Editing of interactivity period (defaulted at 20s)
  - Changing where app data is stored
- A simpler version update path
- Custom rule creation for certain softwares - This will allow better and more personalized handling of software like internet browsers.

## Specific Software and Rules

Self-Track uses a system of Rules to support specific softwares in a more user readable way. Currently we have support for the following software:

| Software           |  Windows  |   Linux   |
| :----------------- | :-------: | :-------: |
| Visual Studio Code | Supported | Supported |
| Google Chrome      | Supported | Supported |
| MongoDb Compass    | Supported | Supported |
| Virtual Box        | Supported | Supported |

You can easily contribute to this list by suggesting new software that should be supported. You can even go one step further and if you have said software installed, record yourself using the software in question with Self-Track and submit that information to us. We'll use it to build rules so that raw data turned into simple to read and digest information.

## Specific Software we cannot detect

There is some software out there that simply do not supply the Operating system enough information for us to be able to detect it. While we by no means have given up on trying to find a way to reliable detect and track the usage of these softwares, these are a list of currently known programs that are not trackable by Self-Track

- LibreSuite on Linux
- File Explorer on Linux Ubuntu

Contibute by adding to this list, or dropping us an issue about specific softwares on this list that you would like us to crack the most. We'll redouble our efforts!

# Credits

This project was built with the aid of Human First Labs (HFL)
