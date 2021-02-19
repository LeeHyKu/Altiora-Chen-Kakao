import { CommandEvent, ChatEvent } from "../Event";
import { Chat, ReplyAttachment, AttachmentTemplate, CustomAttachment } from "@storycraft/node-kakao";
import { Shiritori } from "./DEP_Shiritori";
import { isNullOrUndefined } from "util";
import { KakaoBot } from "../KakaoBot";

export class ShiritoriCom extends CommandEvent {
    readonly command = "끝말잇기";
    readonly aliases = ['끝말', '끄투', '시리토리', '시토', 'shiritori', 'st'];
    readonly description = '끝말잇기';

    HandleArgs(chat: Chat, args: Array<string>) {
        switch (args[0]) {
            case '생성':
            case '만들기':
                if (!Shiritori.Room.rooms.has(chat.Channel.Id)) {
                    Shiritori.Room.rooms.set(chat.Channel.Id, new Shiritori.Room());
                    Shiritori.Room.rooms.get(chat.Channel.Id).join(chat.Sender);
                    let kl = new CustomAttachment();
                    kl.readAttachment(Shiritori.Room.nowpKl(chat.Channel));
                    chat.replyTemplate(new AttachmentTemplate(kl));
                }
                else
                    chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                        `• 이미 생성된 끝말잇기 방이 있습니다.`
                    ));
                break;
            case '삭제':
            case '지우기':
                if (Shiritori.Room.rooms.has(chat.Channel.Id)) {
                    if (!Shiritori.Room.rooms.get(chat.Channel.Id).start) {
                        Shiritori.Room.rooms.delete(chat.Channel.Id);
                        chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                            `• 방이 삭제되었습니다!`
                        ));
                    }
                    else
                        chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                            `• 게임이 이미 시작되어 삭제할 수 없습니다!`
                        ));
                }
                else 
                    chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                        `• 방이 생성되지 않았습니다. '${KakaoBot.prefix}${this.command} (생성/만들기)'`
                    ));
                break;
            case '입장':
            case '들어가기':
            case '참가':
            case '참여':
                if (Shiritori.Room.rooms.has(chat.Channel.Id)) {
                    if (!Shiritori.Room.rooms.get(chat.Channel.Id).start) {
                        if (!Shiritori.Room.rooms.get(chat.Channel.Id).members.has(chat.Sender.Id)) {
                            Shiritori.Room.rooms.get(chat.Channel.Id).join(chat.Sender);
                            let kl = new CustomAttachment();
                            kl.readAttachment(Shiritori.Room.nowpKl(chat.Channel));
                            chat.replyTemplate(new AttachmentTemplate(kl));
                        }
                        else
                            chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                                `• 게임에 이미 참여하셨습니다!`
                            ));
                    }
                    else
                        chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                            `• 게임이 이미 시작되어 입장할 수 없습니다!`
                        ));
                }
                else
                    chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                        `• 방이 생성되지 않았습니다. '${KakaoBot.prefix}${this.command} (생성/만들기)'`
                    ));
                break;
            case '퇴장':
            case '기권':
                if (Shiritori.Room.rooms.has(chat.Channel.Id)) {
                    if (Shiritori.Room.rooms.get(chat.Channel.Id).members.has(chat.Sender.Id)) {
                        if (Shiritori.Room.rooms.get(chat.Channel.Id).start) {
                            if (Shiritori.Room.rooms.get(chat.Channel.Id).turn.equals(chat.Sender.Id))
                                Shiritori.Room.rooms.get(chat.Channel.Id).turn =
                                    Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers
                                    [(Array.from(Shiritori.Room.rooms.get(chat.Channel.Id).members.keys()).indexOf(Shiritori.Room.rooms.get(chat.Channel.Id).turn) + 1) % Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers.length]
                            Shiritori.Room.rooms.get(chat.Channel.Id).members.delete(chat.Sender.Id);
                            Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers.splice
                                (Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers.indexOf(chat.Sender.Id), 1)
                            chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                                `• '${chat.Channel.getUserInfo(chat.Sender).Nickname}'님이 방에서 퇴장하셨습니다`
                            ));
                            let kl = new CustomAttachment();
                            kl.readAttachment(Shiritori.Room.nowpKl(chat.Channel));
                            chat.replyTemplate(new AttachmentTemplate(kl));
                            Shiritori.Room.rooms.get(chat.Channel.Id).log(Shiritori.Logtype.LEAVE, chat.Sender.Id) //LOG
                            if (Shiritori.Room.rooms.get(chat.Channel.Id).members.size == 1) {
                                let wl = new CustomAttachment();
                                wl.readAttachment(Shiritori.winnerKl(chat.Channel.getUserInfoId(Array.from(Shiritori.Room.rooms.get(chat.Channel.Id).members.keys())[0])));
                                chat.replyTemplate(new AttachmentTemplate(wl));
                                Shiritori.Room.rooms.delete(chat.Channel.Id);
                            }
                        }
                        else {
                            Shiritori.Room.rooms.get(chat.Channel.Id).members.delete(chat.Sender.Id);
                            chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                                `• '${chat.Channel.getUserInfo(chat.Sender).Nickname}'님이 방에서 퇴장하셨습니다`
                            ));
                            let kl = new CustomAttachment();
                            kl.readAttachment(Shiritori.Room.nowpKl(chat.Channel));
                            chat.replyTemplate(new AttachmentTemplate(kl));
                            if (Shiritori.Room.rooms.get(chat.Channel.Id).members.size == 0) {
                                Shiritori.Room.rooms.delete(chat.Channel.Id);
                                chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                                    `• 방 인원이 0명이 되어 자동으로 방이 삭제됩니다!`
                                ));
                            }
                        }
                    }
                    else
                        chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                            `• 참여하지 않으셨습니다!`
                        ));
                }
                else
                    chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                        `• 방이 생성되지 않았습니다. '${KakaoBot.prefix}${this.command} (생성/만들기)'`
                    ));
                break;
            case '시작':
                if (Shiritori.Room.rooms.has(chat.Channel.Id)) {
                    if (!Shiritori.Room.rooms.get(chat.Channel.Id).start) {
                        if (Array.from(Shiritori.Room.rooms.get(chat.Channel.Id).members.keys())[0].equals(chat.Sender.Id)) {
                            if (Array.from(Shiritori.Room.rooms.get(chat.Channel.Id).members.keys()).length > 1) {
                                Shiritori.Room.rooms.get(chat.Channel.Id).start = true;
                                Shiritori.Room.rooms.get(chat.Channel.Id).round = 1;
                                Shiritori.Room.rooms.get(chat.Channel.Id).ends =
                                    Shiritori.shuffle(Shiritori.db.jsons(Shiritori.shuffle(Shiritori.cCho)[0]).map(w => w[0]))
                                        .find(w => Shiritori.db.startsWith(w).length)
                                Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers =
                                    Shiritori.shuffle(Array.from(Shiritori.Room.rooms.get(chat.Channel.Id).members.keys()));
                                Shiritori.Room.rooms.get(chat.Channel.Id).turn = Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers[0];
                                Shiritori.Room.rooms.get(chat.Channel.Id).log(Shiritori.Logtype.START, null);
                                Shiritori.Room.rooms.get(chat.Channel.Id).log(Shiritori.Logtype.PLAYERLIST, Array.from(Shiritori.Room.rooms.get(chat.Channel.Id).members.keys()))
                                Shiritori.Room.rooms.get(chat.Channel.Id).log(Shiritori.Logtype.ACTION, { u: null, a: Shiritori.Room.rooms.get(chat.Channel.Id).ends });
                                chat.replyText(`시작단어:'${Shiritori.Room.rooms.get(chat.Channel.Id).ends}', 
${chat.Channel.getUserInfoId(Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers[0]).Nickname} 님 입력해주세요`);
                                /*console.log(Shiritori.Room.rooms.get(chat.Channel.Id));
                                console.log(Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers.map(e => {
                                    let a = chat.Channel.getUserInfoId(e);
                                    return { T: a.Nickname, TH: { W: 200, H: 200, SC: 1, THU: a.FullProfileImageURL } }
                                }));
                                
                                let k = new CustomAttachment();
                                k.readAttachment({
                                    P: {
                                        TP: 'List', ME: '입력순서', SID: 'GKB', DID: 'GKB', SNM: `Ch'en By HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                                        SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                                    },
                                    C: {
                                        THC: 3,
                                        HD: { TD: { T: `시작단어 ${Shiritori.Room.rooms.get(chat.Channel.Id).ends}` } },
                                        ITL: Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers.map(e => {
                                            let a = chat.Channel.getUserInfoId(e);
                                            return { T: a.Nickname, TH: { W: 200, H: 200, SC: 1, THU: a.FullProfileImageURL } }
                                        })
                                    }
                                });
                                
                                console.log(Shiritori.Room.rooms.get(chat.Channel.Id).ends);
                                console.log(k);
                                chat.replyTemplate(new AttachmentTemplate(k));*/
                            }
                            else
                                chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                                    `• 최소 2명이어야 게임을 시작할 수 있습니다!`
                                ));
                        }
                        else
                            chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                                `• 방장만 게임을 시작할 수 있습니다!`
                            ));
                    }
                    else
                        chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                            `• 게임이 이미 시작되었습니다!`
                        ));
                }
                else
                    chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                        `• 방이 생성되지 않았습니다. '${KakaoBot.prefix}${this.command} (생성/만들기)'`
                    ));
                break;
            case '종료':
                if (Shiritori.Room.rooms.has(chat.Channel.Id)) {
                    if (!Shiritori.Room.rooms.get(chat.Channel.Id).start) {
                        if (Array.from(Shiritori.Room.rooms.get(chat.Channel.Id).members.keys())[0].equals(chat.Sender.Id)) {
                            //Shiritori.Room.rooms.get(chat.Channel.Id).log(Shiritori.Logtype.)
                            Shiritori.Room.rooms.delete(chat.Channel.Id);
                            chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                                `• 게임이 종료됩니다.`
                            ));
                        }
                    }
                }
                break;
            case '로그':
                chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                    `• 준비중입니다`
                ));
                break;
            case '한방단어':
                if (Shiritori.Room.rooms.has(chat.Channel.Id)) {
                    if (!Shiritori.Room.rooms.get(chat.Channel.Id).start) {
                        Shiritori.Room.rooms.get(chat.Channel.Id).once = 
                            !Shiritori.Room.rooms.get(chat.Channel.Id).once;
                        chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                            `• 한방단어 모드가 ${Shiritori.Room.rooms.get(chat.Channel.Id).once?'켜':'꺼'}졌습니다!`
                        ));
                    }
                    else
                        chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                            `• 게임이 이미 시작되어 세팅을 바꿀 수 없습니다!`
                        ));
                }
                else
                    chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                        `• 방이 생성되지 않았습니다. '${KakaoBot.prefix}${this.command} (생성/만들기)'`
                    ));
                break;
        }
    }
}

export class ShiritoriHandler extends ChatEvent {
    readonly prefix = ':';

    Handle(chat: Chat) {
        if (
            !Shiritori.Room.rooms.has(chat.Channel.Id) ||
            !Shiritori.Room.rooms.get(chat.Channel.Id).start ||
            !Shiritori.Room.rooms.get(chat.Channel.Id).turn.equals(chat.Sender.Id) ||
            !chat.Text.startsWith(this.prefix)
        ) //nomal chat
            return;

        //Handle Shiritori Routine
        var word = chat.Text.substr(1).trim();
        if (Shiritori.db.exists(word)) {
            if (Shiritori.twoSounds(Shiritori.Room.rooms.get(chat.Channel.Id).ends)
                .indexOf(Shiritori.sep(word[0]).join("")) + 1) {
                if (Shiritori.Room.rooms.get(chat.Channel.Id).logs.filter(e => e.t == Shiritori.Logtype.ACTION).map(e => e.d).indexOf(word) == -1) {
                    var isOnce = !Shiritori.twoSounds(Shiritori.Room.rooms.get(chat.Channel.Id).ends).some(w => Shiritori.db.jsons(Shiritori.sep(w[0])[0]).some(e => Shiritori.sep(e[0]).join("") == Shiritori.sep(w).join("")))
                    //replier.reply(isOnce)
                    if ((isOnce && Shiritori.Room.rooms.get(chat.Channel.Id).once) || !isOnce) {
                        if ((Shiritori.Room.rooms.get(chat.Channel.Id).round == 1 && !isOnce) || Shiritori.Room.rooms.get(chat.Channel.Id).round != 1) {
                            Shiritori.Room.rooms.get(chat.Channel.Id).ends = word.substr(word.length - 1)
                            Shiritori.Room.rooms.get(chat.Channel.Id).turn = Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers[(Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers.indexOf(Shiritori.Room.rooms.get(chat.Channel.Id).turn) + 1) % Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers.length]

                            let a = new CustomAttachment();
                            a.readAttachment(
                                Shiritori.nextKl(
                                    chat.Channel.getUserInfo(chat.Sender),
                                    chat.Channel.getUserInfoId(Shiritori.Room.rooms.get(chat.Channel.Id).turn),
                                    word,
                                    Shiritori.db.mean(word)[0]
                                ));
                            chat.replyTemplate(new AttachmentTemplate(a));
                            
                            Shiritori.Room.rooms.get(chat.Channel.Id).round++
                            Shiritori.Room.rooms.get(chat.Channel.Id).log(Shiritori.Logtype.ACTION, { u: chat.Sender.Id, a: word })
                            var isEmpty = !Shiritori.twoSounds(Shiritori.Room.rooms.get(chat.Channel.Id).ends).some(r => Shiritori.db.jsons(r[0]).filter(e => r == Shiritori.sep(e[0]).join("")).filter(e => Shiritori.Room.rooms.get(chat.Channel.Id).logs.filter(e => e.t == Shiritori.Logtype.ACTION).map(e => e.d).indexOf(word) == -1).length)
                            if (!isOnce && !isEmpty) {
                                //ness?
                                //chat.replyText("• '" + Shiritori.Room.rooms.get(chat.Channel.Id).turn + "' 님은 " + Shiritori.Room.rooms.get(chat.Channel.Id).ends + " (으)로 시작하는 단어를 입력해 주세요.")

                                Shiritori.Room.rooms.get(chat.Channel.Id).round++
                            } else {
                                Shiritori.Room.rooms.get(chat.Channel.Id).members.set(Shiritori.Room.rooms.get(chat.Channel.Id).turn, Shiritori.Room.rooms.get(chat.Channel.Id).members.get(Shiritori.Room.rooms.get(chat.Channel.Id).turn) - 1);

                                chat.replyText([
                                    isOnce ? "• '" + word + "' (은)는 한방단어입니다!" : "• 더 이상 입력할 단어가 없습니다!",
                                    "'" + Shiritori.Room.rooms.get(chat.Channel.Id).turn + "' 님의 라이프가 1 감소됩니다!\n",
                                    Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers.map((a, b) => (b + 1) + ". " + a + " (라이프 : " + Shiritori.Room.rooms.get(chat.Channel.Id).members[a] + ")").join("\n")
                                ].join("\n"))
                                //Shiritori.Room.rooms.get(chat.Channel.Id).log.push(sender + " 라이프 1 감소")
                                if (!Shiritori.Room.rooms.get(chat.Channel.Id).members.get(Shiritori.Room.rooms.get(chat.Channel.Id).turn)) {
                                    Shiritori.Room.rooms.get(chat.Channel.Id).members.delete(Shiritori.Room.rooms.get(chat.Channel.Id).turn);
                                    Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers.splice(Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers.indexOf(Shiritori.Room.rooms.get(chat.Channel.Id).turn), 1)
                                    chat.replyText("• '" + Shiritori.Room.rooms.get(chat.Channel.Id).turn + "' 님이 라이프가 0이 되어 아웃되었습니다!")
                                    //Shiritori.Room.rooms.get(chat.Channel.Id).log.push(sender + " 아웃")
                                }
                                if (Object.keys(Shiritori.Room.rooms.get(chat.Channel.Id).members).length != 1) {
                                    Shiritori.Room.rooms.get(chat.Channel.Id).turn = Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers[(Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers.indexOf(Shiritori.Room.rooms.get(chat.Channel.Id).turn) + 1) % Shiritori.Room.rooms.get(chat.Channel.Id).shuffledMembers.length]
                                    Shiritori.Room.rooms.get(chat.Channel.Id).ends = Shiritori.shuffle(Shiritori.db.jsons(Shiritori.shuffle(Shiritori.cCho)[0]).map(e => e[0])).filter(w => Shiritori.Room.rooms.get(chat.Channel.Id).logs
                                        .map(a => { try { return a.d.a; } catch { return null; } })
                                        .indexOf(w[0]) == -1).find(w => Shiritori.db.startsWith(w).length)
                                    chat.replyText("• '" + Shiritori.Room.rooms.get(chat.Channel.Id).turn + "' 님은 " + Shiritori.Room.rooms.get(chat.Channel.Id).ends + " 로 시작하는 단어를 입력해 주세요.")
                                } else {
                                    //Shiritori.Room.rooms.get(chat.Channel.Id).log()
                                    /*replier.reply([
                                        "• 인원이 1명이 되어 게임이 종료됩니다.",
                                        "승리자는 '" + Object.keys(Shiritori.Room.rooms.get(chat.Channel.Id).members)[0] + "' 님 입니다!",
                                        Lw, "\n", getLog(Shiritori.Room.rooms.get(chat.Channel.Id).log)
                                    ].join("\n"))*/
                                    let wl = new CustomAttachment();
                                    wl.readAttachment(Shiritori.winnerKl(chat.Channel.getUserInfoId(Array.from(Shiritori.Room.rooms.get(chat.Channel.Id).members.keys())[0])));
                                    chat.replyTemplate(new AttachmentTemplate(wl));
                                    Shiritori.Room.rooms.delete(chat.Channel.Id);
                                }
                            }
                        }
                        else
                            chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                                `• 첫 턴 한방단어는 금지입니다!`
                            ));
                    } else
                        chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                            `• 한방단어 금지 룰이 켜져있습니다!`
                        ));
                } else
                    chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                        `• 이미 사용한 단어입니다!`
                    ));
            } else
                chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
                    "• " + Shiritori.Room.rooms.get(chat.Channel.Id).ends + " (으)로 시작하는 단어를 입력해 주세요!"
                ));
        } else chat.replyTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat),
`• '" + word + "' (은)는 없는 단어입니다!,
다시 입력해 주세요.`
        ));
    }
}