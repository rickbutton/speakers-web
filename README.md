# speakers


## What is this?

`speakers` is a web application that intends to stream a 'broadcaster's' speaker audio to a set of 'speakers', which are other computers. It is written with the intention to use the local network to setup a large speaker network, at something like a party or in a dorm room.

## How does it work?

Modern operating systems making it extremely hard, if not impossible, to gain access to the raw speaker data, and there, in most cases, is no API or function calls to enable this. In order to get around this, `speakers` uses the concept of a loopback. In software, a loopback is a fake audio driver that routes the audio in a way a program can consume, and in hardware it is simply a cable that runs from the speaker output to the microphone.

`speakers` simply gets the output of the loopback using the [Web Audio API](https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html). This is essentially a brand new API, and because of this, it is not implemented 100% on any browsers. The only browser that currently works on the broadcasting side is the latest version of Chrome, with the Live Web Audio flag set. On the speaker side, the latest version of Chrome and Firefox should work out of the box, although Firefox is untested.

`speakers` takes this PCM audio and streams it to the clients using WebSockets. In the future this will be encoded using a proper compression algorithm, and sent over a connection more suitable for streaming (UDP based).

## Usage

### Setup the loopback

TODO: OS Setup

### Setup the server

1. Start the server with `rails s`
2. Go to `localhost:3000/broadcast/[A_ROOM_NAME]` to broadcast to clients. Make sure you have the web audio flag set in Chrome. Choose the proper input when Chrome asks.
3. Go to `localhost:3000/speaker/[A_ROOM_NAME]` on another computer. Listen to the sound!

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

