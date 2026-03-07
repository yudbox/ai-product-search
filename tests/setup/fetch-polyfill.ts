/* eslint-disable @typescript-eslint/no-explicit-any */
// Polyfill fetch API for jsdom environment (required for MSW)
import "whatwg-fetch";
import { TextEncoder, TextDecoder } from "util";
import { MessageChannel } from "worker_threads";
import "web-streams-polyfill/polyfill";
import "broadcastchannel-polyfill";

// Polyfill TextEncoder and TextDecoder for jsdom
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;
global.MessageChannel = MessageChannel as any;
