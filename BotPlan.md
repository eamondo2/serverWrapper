# This bot will be used for the server

Consists of a server launcher/wrapper, and a discord bot.
The discord bot will have an authentication scheme, and a method for passing commands
back and forth from the server wrapper.
The server wrapper will have a configurable set of alarms to notify, both in discord and in the server
Optional server log echo to the discord admin channel

split into discrete segments,

discord bot that offers discord specific functionality, passes events to the serverManager, handles auth

hardware monitor, offers hardware info, memory usage, load calc, temp monitor.
has options for alerts on set values

potentially extend the server manager to handle multiple servers, allow for instancing and control of multiple at once



for the server manager, we need a class type to hold the running server

it needs to hook back to the main operating class

it needs to have an initialization function to start the server

it needs to parse the config file for information about server instances

the initialize function has to hook the global event queue, for dispatch to discord etc

each instance gets rcon info

