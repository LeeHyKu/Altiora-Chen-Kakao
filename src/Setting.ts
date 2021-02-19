import * as jsonfile from 'jsonfile';
import { ChatChannel, Long } from '@storycraft/node-kakao';
import { KakaoBot } from './KakaoBot';
import { isNullOrUndefined } from 'util';

export namespace CustomSetting {
    const savepath = './dat/custom'; //RUN AT app.ts;js

    export async function LoadData() {
        /*
        load guide
        
        1.load default file
        2.check if room is vaild / player is vaild
        3.if invaild, skip
        4.comp' process
        5.loop
        */
        try {
            jsonfile.readFileSync(`${savepath}/saves.json`)
                .forEach(async e => {
                    try {
                        let a = Setting.fromJSON(e);
                        if (isNullOrUndefined(a.channel))
                            return;
                        settings.set(a.channel, a);
                    }
                    catch (e) { console.log(e); }
                });
        }
        catch { }
    }
    export function SaveData() {
        /*
        save guide
        
        1.save data to default file
        2.save data to 'data_year_month_day_daysecond.json'
        */
        var a = Array.from(settings.values()).map(e => e.toJSON);
        jsonfile.writeFileSync(`${savepath}/saves.json`, a, { spaces: 2, EOL: '\r\n' });

        let d = new Date();
        jsonfile.writeFileSync(`${savepath}/archive/${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}D${d.getHours()}.${d.getMinutes()}.${d.getSeconds()}T${d.getMilliseconds()}Z.json`, a, { spaces: 2, EOL: '\r\n' });
    }

    export const settings: Map<ChatChannel,Setting> = new Map();

    export function getSettings(c: ChatChannel) {
        if (!settings.has(c))
            settings.set(c, new Setting(c));
        return settings.get(c);
    } 

    export class Setting {
        constructor(c: ChatChannel) {
            this.channel = c;
        }

        /* kakao info */
        channel: ChatChannel;

        /* system setting */
        disallowEvents: Array<string> = [];

        /* custom setting */
        //custom: Map<string, any> = new Map();

        get toJSON(): SettingRaw {
            return {
                channel: this.channel.Id.toString(),
                disallowEvents: this.disallowEvents,
                //custom: this.custom
            }
        }
        static fromJSON(e: SettingRaw) {
            let a = new Setting(KakaoBot.client.ChannelManager.get(Long.fromString(e.channel)));
            a.disallowEvents = e.disallowEvents;
            //a.custom = new Map(e.custom);
            return a;
        }
    }

    export interface SettingRaw {
        channel: string; //LONG
        disallowEvents: Array<string>;
        //custom: any; //new Map(custom)
    }
}