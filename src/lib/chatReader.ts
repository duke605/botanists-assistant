import { captureHold, mixColor, Rect } from 'alt1';
import ChatboxReader, { ChatLine } from 'alt1/chatbox';
import dayjs from 'dayjs';

class ChatReader {
  private reader: ChatboxReader;
  private listeners: ((linesOrError: ChatLine | Error) => void)[] = [];
  private intervalId: number;
  private box: Rect | undefined;
  private _interval: number = 600;

  public readonly TS_REGEX = /\[(?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})\]/;

  constructor() {
    this.intervalId = -1;
    this.reader = new ChatboxReader();
    this.reader.readargs.colors.push(mixColor(0xfe, 0xaf, 0x00));
    this.reader.readargs.colors.push(mixColor(0x44, 0x8F, 0x21));
  }

  set interval(n: number) {
    this._interval = n;

    if (this.intervalId !== -1) {
      window.clearInterval(this.intervalId);
      this.intervalId = window.setInterval(this.readChat, this._interval);
    }
  }

  private sendToListeners = (linesOrError: ChatLine | Error) => {
    for (const listener of this.listeners) {
      listener(linesOrError);
    }
  }

  private findChatbox = async () => {
    for (let i = 0; !this.box; i++) {
      try {
        this.box = (this.reader.find()?.mainbox as any)?.rect;
      } catch (e) {
        console.error(e);
        break;
      }

      if (!this.box && i >= 2) {
        this.sendToListeners(new Error('chatbox_not_found'));
        return;
      } else if (!this.box) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  private readChat = async () => {
    if (!this.box) await this.findChatbox();
    if (!this.box) return;

    const capture = captureHold(this.box.x, this.box.y, this.box.width, this.box.height);
    const lines = this.reader.read(capture);
    if ((lines?.length ?? 0) <= 0) return;

    // Processing lines
    for (let i = 0; i < lines!.length; i++) {
      const line = lines![0];
      
      // Adding the next lines onto the currently line if they don't start with a time stamp
      for (;; i++) {
        if (!line[i+1] || line[i+1].text.match(this.TS_REGEX)) break;
        
        line.text += ' ' + lines![i+1].text;
      }

      // Checking if the stamp is old
      const tsMatch = line.text.match(this.TS_REGEX);
      if (!tsMatch) continue;

      const now = dayjs();
      const readTimestamp = +tsMatch.groups!.hour * 60 * 60 +
        +tsMatch.groups!.minute * 60 +
        +tsMatch.groups!.second;
      const currentTimestamp = now.hour() * 60 * 60
        + now.minute() * 60
        + now.second();
      const delta = Math.abs(currentTimestamp - readTimestamp);
      if (delta > 1) continue;
      
      console.log(line.text);
      this.sendToListeners(line);
    }
  }

  subscribe = (listener: typeof this.listeners[0]) => {
    this.listeners.push(listener);

    if (this.intervalId === -1) {
      this.intervalId = window.setInterval(this.readChat, this._interval);
    }

    return () => this.unsubscribe(listener);
  }

  unsubscribe = (listener: typeof this.listeners[0]) => {
    this.listeners = this.listeners.filter(l => l !== listener);

    if (this.listeners.length === 0) {
      window.clearInterval(this.intervalId);
      this.intervalId = -1;
    }
  }
}

export default new ChatReader();
