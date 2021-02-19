import { DollData, DollMoreinfoPrefix } from '../../res/GirlsFrontline/Doll_Database.json';
import { FairyData, FairyMoreInfoPrefix, EquData, EquUrl } from '../../res/GirlsFrontline/Equipment_Database.json';
import { CustomAttachment, Chat, AttachmentTemplate, ReplyAttachment, ChannelType } from '@storycraft/node-kakao';
import { CommandEvent, ChatEvent } from '../Event';

export class DollTimetable extends CommandEvent {
    readonly command = '\u200bㅇ0';

    Handle(chat: Chat) {
        if (!/^ㅇ0([0-8])([0-6])([0-9])$/.test(chat.Text) || chat.Channel.Type == ChannelType.DIRECT || chat.Channel.Type == ChannelType.GROUP)
            return;

        let a = chat.Text;
        switch (true) {
            case /^ㅇ0000$/.test(a):
                return;
          //case /^ㅇ([0-8])([0-6])([0-9])$/.test(a):
          //    a = a.slice(1);
          //    break;
            case /^ㅇ0([0-8])([0-6])([0-9])$/.test(a):
                a = a.slice(2);
                break;
            default:
                return;
        }

        let b = {
            P: {
                TP: 'List',
                ME: '',
                SID: 'GKB',
                DID: 'GKB',
                SNM: 'Database from 소전DB',
                SIC: '',
                SL: {
                    LPC: 'https://gfl.zzzzz.kr/',
                    LMO: 'https://gfl.zzzzz.kr/'
                },
                VA: '6.0.0',
                VI: '5.9.8',
                VW: '2.5.1',
                VM: '2.2.0'
            },
            C: {
                THC: 1,
                HD: {
                    TD: {
                        T: ''
                    }
                },
                ITL: []
            }
        };
        b.P.ME = `0${a[0]}:${a[1]}${a[2]} 시간표`;
        b.C.HD.TD.T = `0${a[0]}:${a[1]}${a[2]} 시간표`;
        b.C.ITL = DollData.filter(c => c.buildtime == a).map(d => ({ TD: { T: d.name, D: `${'★'.repeat(parseInt(d.star))} | ${d.guntype}` }, TH: { W: 200, H: 200, SC: 1, THU: d.imgurl }, L: { LPC: `${DollMoreinfoPrefix}${d.id}`, LMO: `${DollMoreinfoPrefix}${d.id}` } }));
        if (b.C.ITL.length == 0)
            return;

        let f = new CustomAttachment();
        f.readAttachment(b);
        let g = new AttachmentTemplate(f);

        chat.replyTemplate(g);
    }
}

export class EquTimetable extends CommandEvent {
    readonly command = '\u200bㅈ0';

    Handle(chat: Chat) {
        if (!/^ㅈ0[0-5])([0-6])([0-9])$/.test(chat.Text) || chat.Channel.Type == ChannelType.DIRECT || chat.Channel.Type == ChannelType.GROUP)
            return;

        let a = chat.Text.slice(1);
        switch (true) {
            case /^0([0-1])00$/.test(a):
                return;
          //case /^([0-8])([0-6])([0-9])$/.test(a):
          //    break;
            case /^0([0-8])([0-6])([0-9])$/.test(a):
                a = a.slice(1);
                break;
            default:
                return;
        }

        let b = {
            P: {
                TP: 'List',
                ME: '',
                SID: 'GKB',
                DID: 'GKB',
                SNM: 'Database from 소전DB',
                SIC: 'https://pbs.twimg.com/profile_images/958966893175480326/9s86roBm_400x400.jpg',
                SL: {
                    LPC: 'https://gfl.zzzzz.kr/',
                    LMO: 'https://gfl.zzzzz.kr/'
                },
                VA: '6.0.0',
                VI: '5.9.8',
                VW: '2.5.1',
                VM: '2.2.0'
            },
            C: {
                THC: 1,
                HD: {
                    TD: {
                        T: ''
                    }
                },
                ITL: []
            }
        };
        b.P.ME = `0${a[0]}:${a[1]}${a[2]} 시간표`;
        b.C.HD.TD.T = `0${a[0]}:${a[1]}${a[2]} 시간표`;
        b.C.ITL = b.C.ITL.concat(FairyData.filter(c => c.buildtime == a).map(d => ({ TD: { T: d.name, D: '' }, TH: { W: 200, H: 200, SC: 1, THU: d.imgurl }, L: { LPC: `${FairyMoreInfoPrefix}${d.id}`, LMO: `${FairyMoreInfoPrefix}${d.id}` } })));
        b.C.ITL = b.C.ITL.concat(EquData.filter(c => c.buildtime == a).map(d => ({ TD: { T: d.name, D: '★'.repeat(parseInt(d.star)) }, TH: { W: 200, H: 200, SC: 1, THU: d.imgurl }, L: { LPC: `${EquUrl}`, LMO: `${EquUrl}` } })));
        if (b.C.ITL.length == 0)
            return;

        let f = new CustomAttachment();
        f.readAttachment(b);
        let g = new AttachmentTemplate(f);

        chat.replyTemplate(g);
    }
}