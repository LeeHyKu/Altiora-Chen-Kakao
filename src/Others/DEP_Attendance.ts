import { CommandEvent } from "../Event";
import { KakaoBot } from "../KakaoBot";
import { Long, ChatUser, Chat, OpenChatUserInfo, ChannelType, OpenChatChannel, AttachmentTemplate, CustomAttachment, OpenLinkProfile } from "@storycraft/node-kakao";
import { isNullOrUndefined } from "util";

class AttendanceManager {
    static readonly inst = new AttendanceManager();

    map: Map<Long, Array<Chat>> = new Map();
    add(chat: Chat):number {
        if (!this.map.has(chat.Channel.Id))
            this.map.set(chat.Channel.Id, []);
        return this.map.get(chat.Channel.Id).push(chat);
    }
    isAlready(chat: Chat) { return (this.map.has(chat.Channel.Id)) && (!isNullOrUndefined(this.map.get(chat.Channel.Id).find(a => a.Sender.Id.equals(chat.Sender.Id)))); }
}

export class AttendanceCommand extends CommandEvent {
    Handle(chat: Chat) {
        if (AttendanceManager.inst.isAlready(chat))
            return chat.replyText('이미 출석되었습니다');
        return chat.replyText(`${chat.Channel.getUserInfo(chat.Sender).Nickname}님, ${AttendanceManager.inst.add(chat)}등으로 출석되었습니다`);
    }
}

export class AttendanceRank extends CommandEvent {
    async HandleAsync(chat: Chat) {
        if (!AttendanceManager.inst.map.has(chat.Channel.Id))
            chat.replyText('순위가 없습니다');
        else {
            var a = {
                P: {
                    TP: 'List', ME: '출석 순위표', SID: 'GKB', DID: 'GKB',
                    SNM: 'by HKLee', SIC: '',
                    SL: { },
                    VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                },
                C: {
                    THC: 1,
                    HD: {
                        TD: {
                            T: '출석 순위'
                        }
                    },
                    ITL: []
                }
            };
            try {
                for (let i = 0; i < AttendanceManager.inst.map.get(chat.Channel.Id).length || i < 6; i++) {
                    let b = AttendanceManager.inst.map.get(chat.Channel.Id)[i];
                    let c = b.Channel.getUserInfo(b.Sender);
                    let d = (c.isOpenUser()) ? await (c as OpenChatUserInfo).getOpenLink() : '';
                    let e = (c.isOpenUser()) ? { LPC: (d as OpenLinkProfile).LinkURL, LMO: (d as OpenLinkProfile).LinkURL } : {};
                    let f = { TD: { T: c.Nickname, D: `출석 시간:${(new Date(b.SendTime)).getHours()}:${(new Date(b.SendTime)).getMinutes()} (개선예정)` }, TH: { W: 200, H: 200, SC: 1, THU: c.ProfileImageURL }, L: e };
                    a.C.ITL.push(f);
                }
            }
            catch{

            }
            let g = new CustomAttachment();
            g.readAttachment(a);
            let h = new AttachmentTemplate(g);

            chat.replyTemplate(h);
        }
    }
}