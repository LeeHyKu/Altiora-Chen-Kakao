import { Long } from "bson";
import { Chat, ChannelType, ChatMention, OpenChatChannel, ChatType, ChatChannel, ReplyChat, ReplyAttachment, AttachmentTemplate, MentionContentList } from "@storycraft/node-kakao";
import { ChatEvent, CommandEvent } from "../Event";
import { isNullOrUndefined, isNull } from "util";
import { KakaoBot } from "../KakaoBot";

export namespace Management {
    const rooms: Map<ChatChannel, Room> = new Map();

    export function getRoom(c: ChatChannel) {
        if (!rooms.has(c))
            rooms.set(c, new Room(c));
        return rooms.get(c);
    }

    export class Room {
        room: ChatChannel;

        notify: boolean = true;
        reports: Array<ReportInfo> = [];

        constructor(c: ChatChannel) {
            this.room = c;
        }

        addReport(a: ReportInfo) { this.reports.push(a); this.notify = false; }
        get getReports() { this.notify = true; return this.reports; }

        //TODO:LOAD function
        //TODO:TO json
    }

    export interface ReportInfo {
        reportMessage: string;
        reportLogId: Long;
        reportUser: Long
        reportBy: Long;
        reportComment: string;

        /* FOR REPLY CONTENT */
        Type: ChatType;
        MentionList: Array<MentionContentList>
    }

    export namespace Events {
        export class Hides extends CommandEvent {
            readonly command = '가리기';
            readonly description = '답장하기를 사용하여 여러개의 채팅을 빠르게 가립니다'

            readonly confirm = [ 'Y','y','네' ];

            async HandleArgsAsync(chat: Chat,args:Array<string>) {
                if (chat.Channel.Type != ChannelType.OPENCHAT_GROUP)
                    chat.replyText('오픈채팅에서만 사용가능합니다');
                else if (!(chat.Channel as OpenChatChannel).canManageChannel(chat.Sender))
                    chat.replyText('권한이 없습니다');
                else if (!(chat.Channel as OpenChatChannel).canManageChannel(chat.Sender.Client.ClientUser))
                    chat.replyText('봇이 관리자가 아닙니다');
                else if (chat.Type != ChatType.Reply)
                    chat.replyText('답장하기를 사용해 가릴 채팅의 시작부분을 가르켜주세요');
                else if (isNaN(parseInt(args[0])) || parseInt(args[0]) < 1 || parseInt(args[0]) > 90)
                    chat.replyText('올바른 숫자를 입력해주세요(90 이하)');
                else {
                    try {
                        var a = (await chat.Sender.Client.ChatManager.getChatListFrom(chat.Channel.Id, (chat as ReplyChat).Reply.SourceLogId.toNumber())).result;
                        var b = Math.min(parseInt(args[0]), a.length);
                        chat.replyTemplate(new AttachmentTemplate((chat as ReplyChat).Reply, `이 채팅 아래에 있는 ${b}개의 채팅을 가립니다. 계속하시겠습니까?(Y/N)`));
                        chat.Sender.once('message', async (ch: Chat) => {
                            if (!this.confirm.includes(ch.Text))
                                ch.replyText('취소되었습니다');
                            else {
                                ch.replyText(`${b}개의 채팅을 가립니다...`);
                                await (chat.Channel as OpenChatChannel).hideChatId((chat as ReplyChat).Reply.SourceLogId);
                                for (let i = 0; i < b-1; i++) {
                                    if (a[i].Hidable)
                                        await a[i].hide();
                                }
                                ch.replyText('가리기 완료');
                            }
                        });
                    }
                    catch (e) {
                        chat.replyText(`에러발생:${e}`);
                    }
                }
            }
        }
        export class Alart extends ChatEvent {
            Handle(chat: Chat) {
                if (
                    chat.Channel.Type != ChannelType.OPENCHAT_GROUP ||
                    !(chat.Channel as OpenChatChannel).canManageChannel(chat.Sender) ||
                    getRoom(chat.Channel).notify || getRoom(chat.Channel).reports.length < 1
                )
                    return;

                var a: Array<any> = [` 대기중인 신고가 있습니다${'\u200b'.repeat(500)}\n\n`];
                getRoom(chat.Channel).getReports.forEach((e, i) => {
                    a.push(`${i + 1}.`); try { a.push(new ChatMention(chat.Channel.getUserInfoId(e.reportUser))) } catch { '알 수 없는 유저' }
                    a.push(`\n신고내용: ${e.reportMessage}
설명: ${e.reportComment}
신고자: `); a.push(new ChatMention(chat.Channel.getUserInfoId(e.reportBy))); a.push('\n');
                });
                a.push(`
명령어 ${KakaoBot.prefix}${new Process().command} 을 사용하여 신고를 처리할 수 있습니다`);
                chat.replyText(new ChatMention(chat.Channel.getUserInfo(chat.Sender)), ...a);
            }
        }
        export class Report extends CommandEvent {
            readonly command = '신고';
            readonly aliases = [];
            readonly description = `답장하기를 사용하여 신고를 합니다. 오픈채팅에서만 사용할 수 있습니다.`;

            Handle(chat: Chat) {
                if (chat.Channel.Type != ChannelType.OPENCHAT_GROUP)
                    chat.replyText('오픈채팅에서만 사용할 수 있는 기능입니다')
                else if (chat.Type != ChatType.Reply)
                    chat.replyText('답장하기를 사용하여 신고할 채팅을 지정해주세요');
                else {
                    getRoom(chat.Channel).addReport(
                        { Type: (chat as ReplyChat).Reply.SourceType, MentionList: (chat as ReplyChat).Reply.SourceMentionList, reportBy: chat.Sender.Id, reportLogId: (chat as ReplyChat).Reply.SourceLogId, reportUser: (chat as ReplyChat).Reply.SourceUserId, reportMessage: (chat as ReplyChat).Reply.SourceMessage, reportComment: (!isNullOrUndefined(chat.Text.split(' ')[1]) ? chat.Text.split(' ').slice(1).join(' ') : '설명없음') }
                    );
                    chat.replyText('신고가 접수되었습니다');
                }
            }
        }
        export class Process extends CommandEvent {
            readonly command = '처리';
            readonly description = `관리자용 커맨드, 자세한 정보: ${KakaoBot.prefix}${this.command}`;

            readonly confirm = ['Y', 'y', '네'];

            HandlePrefix(chat: Chat) {
                chat.replyText(new ChatMention(chat.Channel.getUserInfo(chat.Sender)), `${'\u200b'.repeat(500)}
${KakaoBot.prefix}${this.command} 목록 - 신고 리스트를 불러옵니다
${KakaoBot.prefix}${this.command} <숫자> 삭제 - 신고된 채팅을 가립니다
${KakaoBot.prefix}${this.command} <숫자> 강퇴 - 신고된 유저를 강퇴합니다
${KakaoBot.prefix}${this.command} <숫자> 단순승인 - 신고를 승인만 합니다
${KakaoBot.prefix}${this.command} <숫자> 거부 - 신고를 거부합니다
${KakaoBot.prefix}${this.command} <숫자> 검토 - 신고된 채팅으로 이동합니다`);
            }
            HandleArgs(chat: Chat, args: Array<string>) {
                if (chat.Channel.Type != ChannelType.OPENCHAT_GROUP)
                    chat.replyText('오픈채팅에서만 사용할 수 있는 기능입니다')
                else if (!(chat.Channel as OpenChatChannel).canManageChannel(chat.Sender))
                    chat.replyText('권한이 없습니다');
                else if (isNull(parseInt(args[0])) || parseInt(args[0]) < 1 || parseInt(args[0]) > getRoom(chat.Channel).reports.length)
                    chat.replyText('올바른 숫자를 적어주세요');
                else {
                    var a = parseInt(args[0]) - 1;
                    switch (args[1]) {
                        case '삭제':
                        case '가리기':
                            if (!(chat.Channel as OpenChatChannel).canManageChannel(chat.Sender.Client.ClientUser))
                                chat.replyText('사용할 수 없음:봇이 관리자가 아닙니다');
                            else {
                                let b = getRoom(chat.Channel).reports[a];
                                chat.replyTemplate(new AttachmentTemplate(new ReplyAttachment(b.Type, b.reportLogId, b.reportUser, false, b.reportMessage, b.MentionList), '이 채팅을 가립니다. 계속하시겠습니까?(Y/N)'));
                                chat.Sender.once('message', c => {
                                    if (!this.confirm.includes(c.Text))
                                        c.replyText('취소되었습니다');
                                    else
                                        (chat.Channel as OpenChatChannel).hideChatId(b.reportLogId); c.replyText('채팅을 가렸습니다.');
                                });
                                getRoom(chat.Channel).reports.splice(a, 1);
                            }
                            break;
                        case '강퇴':
                            if (!(chat.Channel as OpenChatChannel).canManageChannel(chat.Sender.Client.ClientUser))
                                chat.replyText('사용할 수 없음:봇이 관리자가 아닙니다');
                            else {
                                let b = getRoom(chat.Channel).reports[a];
                                chat.replyTemplate(new AttachmentTemplate(new ReplyAttachment(b.Type, b.reportLogId, b.reportUser, false, b.reportMessage, b.MentionList), '유저 ', new ChatMention(chat.Channel.getUserInfoId(b.reportUser)), ' 을(를) 강퇴합니다. 계속하시겠습니까?(Y/N)'));
                                chat.Sender.once('message', c => {
                                    if (!this.confirm.includes(c.Text))
                                        c.replyText('취소되었습니다');
                                    else
                                        c.replyText('유저를 강퇴했습니다');
                                });
                                getRoom(chat.Channel).reports.splice(a, 1);
                            }
                            break;
                        case '단순승인': {
                            let b = getRoom(chat.Channel).reports[a];
                            chat.replyTemplate(new AttachmentTemplate(new ReplyAttachment(b.Type, b.reportLogId, b.reportUser, false, b.reportMessage, b.MentionList), '이 채팅에 대한 신고가 승인되었습니다'));
                            getRoom(chat.Channel).reports.splice(a, 1);
                            break;
                        }
                        case '거부': {
                            let b = getRoom(chat.Channel).reports[a];
                            chat.replyTemplate(new AttachmentTemplate(new ReplyAttachment(b.Type, b.reportLogId, b.reportUser, false, b.reportMessage, b.MentionList), '이 채팅에 대한 신고가 거부되었습니다'));
                            getRoom(chat.Channel).reports.splice(a, 1);
                            break;
                        }
                        case '검토': {
                            let b = getRoom(chat.Channel).reports[a];
                            chat.replyTemplate(new AttachmentTemplate(new ReplyAttachment(b.Type, b.reportLogId, b.reportUser, false, b.reportMessage, b.MentionList), '신고된 채팅입니다.'));
                            break;
                        }
                        case '목록': {
                            chat.replyText('TODO, 이 메시지가 보인다면 개발자에게 연락해주세요'); //TODO TODO TODO TODO TODO
                            break;
                        }
                        default:
                            this.HandlePrefix(chat);
                            break;
                    }
                }
            }
        }
    }
}