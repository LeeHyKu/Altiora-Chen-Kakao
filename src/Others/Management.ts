import { CommandEvent } from "../Event";
import { Chat, OpenChatUserInfo, CustomAttachment, AttachmentTemplate, CustomImageCropStyle } from "@storycraft/node-kakao";
import { isNullOrUndefined, isNull } from "util";
import { KakaoBot } from "../KakaoBot";
import { version } from "../../package.json";

export class IdCapture extends CommandEvent {
    readonly Command = '아이디캡쳐';
    readonly aliases = ['idc', '캡쳐'];
    readonly description = '개발용';

    async HandleArgsAsync(chat: Chat, args: Array<string>) {
        switch (args[0]) {
            case '유저':
            case 'user':
                if (chat.getMentionContentList().length != 0) {
                    try {
                        let kaling = {
                            P: {
                                TP: 'List', ME: '유저 ID', SID: 'GKB', DID: 'GKB', SNM: `Ch'en By HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', SL: {},
                                VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                            },
                            C: {
                                THC: 1,
                                HD: { TD: { T: '유저 ID' } },
                                ITL: []
                            }
                        };

                        chat.getMentionContentList().forEach(
                            a => {
                                let b = chat.Channel.getUserInfoId(a.UserId);
                                //let c = !isNullOrUndefined((b as OpenChatUserInfo).getOpenLink) ? (await (b as OpenChatUserInfo).getOpenLink()).LinkURL : null;
                                kaling.C.ITL.push({
                                    TD: { T: b.Nickname, D: `High:${b.Id.getHighBits()} | Low:${b.Id.getLowBits()}` }, TH: { W: 200, H: 200, SC: 1, THU: b.FullProfileImageURL },
                                    //L: isNull(c) ? undefined : { LPC: c, LMO: c }
                                });
                            })
                        
                        let ct = new CustomAttachment();
                        ct.readAttachment(kaling);
                        chat.replyTemplate(new AttachmentTemplate(ct));
                    }
                    catch (e) {
                        chat.replyText(`에러 발생:${e}`);
                    }
                }
                else {
                    chat.replyText(
                        `${chat.Channel.getUserInfo(chat.Sender).Nickname}님의 ID
High: ${chat.Sender.Id.getHighBits()} | Low: ${chat.Sender.Id.getLowBits()}`
                    );
                }
                break;
            case '채널':
            case '톡방':
            case 'ch':
                chat.replyText(`${chat.Channel.Name}의 ID
High: ${chat.Sender.Id.getHighBits()} | Low: ${chat.Sender.Id.getLowBits()}`);
                break;
        }
    }
}

export class Info extends CommandEvent {
    readonly command = '정보';
    readonly aliases = ['info'];
    readonly description = '봇의 정보를 불러옵니다.';

    Handle(chat: Chat) {
        try {
            let kaling = new CustomAttachment();
            kaling.readAttachment({
                P: {
                    TP: 'Feed', ME: "Ch'en", SID: 'GKB', DID: 'GKB', SNM: `Ch'en By HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                    SL: {  },
                    VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                },
                C: {
                    THC: 0,
                    TI: {
                        TD: {
                            T: "Ch'en Kakaotalk Bot",
                            D: `${version} | node ${process.version} | prefix: ${KakaoBot.prefix} | ${process.platform} | uptime: ${Math.floor(process.uptime())}초`
                        }
                    },
                    PR: {
                        TD: { T: "Ch'en" },
                        TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                    }
                }
            });
            chat.replyTemplate(new AttachmentTemplate(kaling));
        }
        catch {

        }
    }
}