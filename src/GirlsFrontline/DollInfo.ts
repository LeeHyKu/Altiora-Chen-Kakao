import * as Database from "../../res/GirlsFrontline/Doll_Database.json";
import { Chat, AttachmentTemplate, ReplyAttachment, CustomAttachment, CustomFeedContent, CustomImageCropStyle, ChannelType } from "@storycraft/node-kakao";
import { isNullOrUndefined, isNull } from "util";
import fs from 'fs';
import { CommandEvent } from "../Event";

var Nicknames = JSON.parse(fs.readFileSync('./res/GirlsFrontline/Doll_Nicknames.json').toString());

export class DollInfo extends CommandEvent {
    readonly command = '인형';
    readonly description = '소녀전선 명령어, 인형의 정보를 가져옵니다';

    HandleArgs(chat: Chat, args: Array<string>) {
        if (chat.Channel.Type == ChannelType.DIRECT || chat.Channel.Type == ChannelType.GROUP)
            return;

        let a = null;
        for (let key in Nicknames) {
            try {
                if (!isNullOrUndefined(Nicknames[key].find((b: string) => b.split(' ').join('').toLowerCase() == args.join('').toLowerCase()))) {
                    a = Database.DollData.find(c => c.name == key);
                    break;
                }
            }
            catch { break; }
        }
        if (isNull(a))
            return chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),'알 수 없는 인형'));

        let b = {
            P: {
                TP: 'Feed',
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
                "THC": 3,
                "THL": [
                    {
                        "TH": {
                            "W": 1000,
                            "H": 1000,
                            "SC": CustomImageCropStyle.ORIGINAL,
                            THU: ''
                        }
                    }
                ],
                TI: {
                    TD: {
                        T: "",
                        D: ""
                    }
                },
                "BUL": [
                    {
                        "BU": {
                            "T": "자세히 보기",
                            "SR": "both"
                        },
                        L: {
                            LPC: '',
                            LMO: ''
                        }
                    }
                ],
                PR: {
                    TD: { T: "By Ch'en kakao bot" },
                    TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                }
            }
        };
        b.P.ME = `${a.name} 정보`;
        b.C.THL[0].TH.THU = a.imgurl;
        b.C.TI.TD.T = a.name;
        b.C.TI.TD.D = `${'★'.repeat(parseInt(a.star))} ${a.guntype}`;
        b.C.BUL[0].L.LPC = `${Database.DollMoreinfoPrefix}${a.id}`;
        b.C.BUL[0].L.LMO = `${Database.DollMoreinfoPrefix}${a.id}`;

        let c = new CustomAttachment();
        c.readAttachment(b);
        let d = new AttachmentTemplate(c);
        
        chat.replyTemplate(d);
    }
}

export class DollNickNames extends CommandEvent {
    private nkns = JSON.parse(fs.readFileSync('./res/GirlsFrontline/Doll_Proposal.json').toString());
    HandleArgument(chat: Chat, args: Array<string>) {
        if (chat.Channel.Type == ChannelType.DIRECT || chat.Channel.Type == ChannelType.GROUP)
            return;

        switch (args[0]) {
            case "리로드":
                try {
                    Nicknames = JSON.parse(fs.readFileSync('./res/GirlsFrontline/Doll_Nicknames.json').toString());
                    chat.replyText('리로드완료');
                }
                catch (e) {
                    chat.replyText(`에러발생:${e.message}`);
                }
                break;
            case "폐기":
                this.nkns = {};
                fs.writeFileSync('./res/GirlsFrontline/Doll_Proposal.json', JSON.stringify(this.nkns));
                chat.replyText('폐기완료');
                break;
            case "검수완료":
                try {
                    for (let a in this.nkns) {
                        for (let b in Nicknames) {
                            if (a.split(' ').join('').toLowerCase() == b.split(' ').join('').toLowerCase()) {
                                for (let i = 0; i < this.nkns[a].length; i++)
                                    Nicknames[b].forEach((e: string) => { if (this.nkns[a][i] == e) this.nkns[a].splice(i,1); });
                                Nicknames[b] = Nicknames[b].concat(this.nkns[a]);
                            }
                        }
                    }
                    fs.writeFileSync('./res/GirlsFrontline/Doll_Nicknames.json', JSON.stringify(Nicknames));
                    this.nkns = {};
                    fs.writeFileSync('./res/GirlsFrontline/Doll_Proposal.json', JSON.stringify(this.nkns));
                    chat.replyText('저장완료');
                }
                catch (e) {
                    chat.replyText('오류발생:' + e.message);
                }
                break;
            case "검수":
                chat.replyText(JSON.stringify(this.nkns));
                break;
            default:
                let a = args.join(' ').split('|');
                if (a.length != 2)
                    return chat.replyText('인형이름|별명');
                if (isNullOrUndefined(this.nkns[a[0].split(' ').join('')]))
                    this.nkns[a[0].split(' ').join('')] = [];
                this.nkns[a[0].split(' ').join('')].push(a[1]);
                chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat), `${a[0]} 인형의 별명으로 ${a[1]}(이)가 제안되었습니다. 검수 후에 추가하겠습니다.`));
                fs.writeFileSync('./res/GirlsFrontline/Doll_Proposal.json', JSON.stringify(this.nkns));
                break;
        }
    }
}