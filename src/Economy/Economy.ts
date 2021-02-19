import { CommandEvent, ChatEvent } from "../Event";
import { Chat, Long, CustomType, CustomImageCropStyle, CustomAttachment, AttachmentTemplate, ChatChannel, OpenChatUserInfo, OpenLinkProfile, ChatMention, ChatUser, OpenChatChannel, ChatUserInfo, UserInfo, ChannelType, MediaDataReceiver } from "@storycraft/node-kakao";
import { isNullOrUndefined, isBoolean } from "util";
import * as jsonfile from "jsonfile";
import { GET } from "../Util/HTTP";
import { KakaoBot } from "../KakaoBot";
import { ManagedBaseChatChannel, ManagedOpenChatChannel } from "@storycraft/node-kakao/dist/talk/managed/managed-chat-channel";
import { ForDeveloper } from "../Others/UtilityCommand";
import { Coral } from "./Coral";

export namespace AquamarineChat {
    export class Management extends CommandEvent {
        readonly command = '유저관리';
        readonly description = '개발자용';
        readonly whitelist = ForDeveloper.dev;

        HandleArgs(chat: Chat, args: Array<string>) {
            switch (args[0]) {
                case '겸치추가': {
                    let send = parseInt(args[1]);
                    if (isNaN(send) || send < 1)
                        chat.replyText('올바른 숫자를 입력하세요');
                    else if (chat.getMentionContentList().length < 1)
                        chat.replyText('유저를 맨션해주세요');
                    else {
                        Aquamarine.getUser(chat.getMentionContentList()[0].UserId, chat.Channel).exp += send;
                        chat.replyText('추가완료');
                    }
                }
                    break;
                case '겸치삭제': {
                    let send = parseInt(args[1]);
                    if (isNaN(send) || send < 1)
                        chat.replyText('올바른 숫자를 입력하세요');
                    else if (chat.getMentionContentList().length < 1)
                        chat.replyText('유저를 맨션해주세요');
                    else {
                        Aquamarine.getUser(chat.getMentionContentList()[0].UserId, chat.Channel).exp -= Math.min(send, Aquamarine.getUser(chat.getMentionContentList()[0].UserId, chat.Channel).exp);
                        chat.replyText('삭제완료');
                    }
                }
                    break;
                case '돈추가': {
                    let send = parseInt(args[1]);
                    if (isNaN(send) || send < 1)
                        chat.replyText('올바른 숫자를 입력하세요');
                    else if (chat.getMentionContentList().length < 1)
                        chat.replyText('유저를 맨션해주세요');
                    else {
                        Aquamarine.getUser(chat.getMentionContentList()[0].UserId, chat.Channel).balance += send;
                        chat.replyText('추가완료');
                    }
                }
                    break;
                case '돈삭제': {
                    let send = parseInt(args[1]);
                    if (isNaN(send) || send < 1)
                        chat.replyText('올바른 숫자를 입력하세요');
                    else if (chat.getMentionContentList().length < 1)
                        chat.replyText('유저를 맨션해주세요');
                    else {
                        Aquamarine.getUser(chat.getMentionContentList()[0].UserId, chat.Channel).balance -= send;
                        chat.replyText('삭제완료');
                    }
                }
                    break;
                case '초기화': {
                    if (chat.getMentionContentList().length < 1)
                        chat.replyText('유저를 맨션해주세요');
                    else {
                        Aquamarine.getUser(chat.getMentionContentList()[0].UserId, chat.Channel).exp = 0;
                        Aquamarine.getUser(chat.getMentionContentList()[0].UserId, chat.Channel).balance = 0;
                        Aquamarine.getUser(chat.getMentionContentList()[0].UserId, chat.Channel).stocks = [];
                        chat.replyText('초기화완료');
                    }
                }
                    break;
            }
        }
    }

    export class Transfer extends CommandEvent {
        readonly command = '송금';
        readonly description = `${KakaoBot.prefix}${this.command} <숫자> <유저맨션>`;

        HandleArgs(chat: Chat, args: Array<string>) {
            let send = parseInt(args[0]);
            if (isNaN(send) || send < 1 || Aquamarine.getUser(chat.Sender.Id, chat.Channel).balance < send)
                chat.replyText('올바른 숫자를 입력하세요');
            else if (chat.getMentionContentList().length < 1)
                chat.replyText('유저를 맨션해주세요');
            else {
                Aquamarine.getUser(chat.getMentionContentList()[0].UserId, chat.Channel).balance += send;
                Aquamarine.getUser(chat.Sender.Id, chat.Channel).balance -= send;
                chat.replyText('송금완료');
            }
        }
    }

    export class Profile extends CommandEvent {
        readonly command = '프로필';
        readonly aliases = [];
        readonly description = `${KakaoBot.prefix}${this.command} 도움말`

        HandlePrefix(chat: Chat) {
            let user = Aquamarine.getUser(chat.Sender.Id, chat.Channel)
            let info = chat.Channel.getUserInfo(chat.Sender);
            let ex = user.level;
            let a = {
                P: {
                    TP: CustomType.FEED, ME: `${info.Nickname}님의 프로필`, SID: 'GKB', DID: 'GKB',
                    SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                    SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                },
                C: {
                    THC: 1,
                    TI: {
                        TD: {
                            T: `Lv.${ex.level}(${ex.remain}/${ex.next})`,
                            D: `잔고:${user.balance}`
                        }
                    },
                    PR: {
                        TD: { T: info.Nickname },
                        TH: { THU: info.FullProfileImageURL, W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                    }
                }
            }
            let b = new CustomAttachment()
            b.readAttachment(a);
            chat.replyTemplate(new AttachmentTemplate(b));
        }
        async HandleArgsAsync(chat: Chat, args: Array<string>) {
            switch (args[0]) {
                case '레벨': {
                    let s = {
                        P: {
                            TP: CustomType.LIST, ME: '레벨 순위표', SID: 'GKB', DID: 'GKB',
                            SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                            SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                        },
                        C: { THC: 1, HD: { TD: { T: '레벨 순위(로컬)' } }, ITL: [] }
                    }

                    let a = Aquamarine.sortLvLocal(chat.Channel);
                    for (let i = 0; i < 5 && i < a.length; i++) {
                        try {
                            let c = await a[i].getUserInfo(chat.Channel);
                            if (isNullOrUndefined(c))
                                continue;
                            let d = {};
                            if (c.isOpenUser() && (c as OpenChatUserInfo).hasOpenProfile()) {
                                let link = await (c as OpenChatUserInfo).getOpenLink();
                                d = { LPC: link.LinkURL, LMO: link.LinkURL }
                            }
                            s['C']['ITL'].push({ TD: { T: c.Nickname, D: `Lv.${a[i].level.level}(${a[i].level.remain}/${a[i].level.next})` }, TH: (isNullOrUndefined(c.ProfileImageURL)) ? undefined : { W: 200, H: 200, SC: 1, THU: c.ProfileImageURL }, L: d });
                        }
                        catch { break; }
                    }
                    let b = new CustomAttachment();
                    b.readAttachment(s);
                    chat.replyTemplate(new AttachmentTemplate(b));
                }
                    break;
                case '레벨전체': {
                    let s = {
                        P: {
                            TP: 'List', ME: '전체 레벨 순위표', SID: 'GKB', DID: 'GKB',
                            SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                            SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                        },
                        C: { THC: 1, HD: { TD: { T: '레벨 순위(전체)' } }, ITL: [] }
                    }

                    let a = Aquamarine.sortLevel();
                    for (let i = 0; i < 5 && i < a.length; i++) {
                        try {
                            let c = await a[i].getUserInfo(chat.Channel);
                            if (isNullOrUndefined(c))
                                continue;
                            let d = {};
                            if (c.isOpenUser() && (c as OpenChatUserInfo).hasOpenProfile()) {
                                let e = await (c as OpenChatUserInfo).getOpenLink();
                                d = { LPC: e.LinkURL, LMO: e.LinkURL }
                            }
                            s['C']['ITL'].push(
                                { TD: { T: c.Nickname, D: `Lv.${a[i].level.level}(${a[i].level.remain}/${a[i].level.next})` }, TH: (isNullOrUndefined(c.ProfileImageURL)) ? undefined : { W: 200, H: 200, SC: 1, THU: c.ProfileImageURL }, L: d }
                            );
                        }
                        catch { break; }
                    }
                    let b = new CustomAttachment();
                    b.readAttachment(s);
                    chat.replyTemplate(new AttachmentTemplate(b));
                }
                    break;
                case '돈': {
                    let s = {
                        P: {
                            TP: 'List', ME: '돈 순위표', SID: 'GKB', DID: 'GKB',
                            SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                            SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                        },
                        C: { THC: 1, HD: { TD: { T: '돈 순위(로컬)' } }, ITL: [] }
                    }

                    let a = Aquamarine.sortBaLocal(chat.Channel);
                    for (let i = 0; i < 5 && i < a.length; i++) {
                        try {
                            let c = await a[i].getUserInfo(chat.Channel);
                            if (isNullOrUndefined(c))
                                continue;
                            let d = {};
                            if (c.isOpenUser() && (c as OpenChatUserInfo).hasOpenProfile()) {
                                let link = await (c as OpenChatUserInfo).getOpenLink();
                                d = { LPC: link.LinkURL, LMO: link.LinkURL }
                            }
                            s['C']['ITL'].push({ TD: { T: c.Nickname, D: `${a[i].balance}원` }, TH: (isNullOrUndefined(c.ProfileImageURL)) ? undefined : { W: 200, H: 200, SC: 1, THU: c.ProfileImageURL }, L: d });
                        }
                        catch { }
                    }
                    let b = new CustomAttachment();
                    b.readAttachment(s);
                    chat.replyTemplate(new AttachmentTemplate(b));
                }
                    break;
                case '돈전체': {
                    let s = {
                        P: {
                            TP: 'List', ME: '전체 돈 순위표', SID: 'GKB', DID: 'GKB',
                            SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                            SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                        },
                        C: { THC: 1, HD: { TD: { T: '돈 순위(전체)' } }, ITL: [] }
                    }

                    let a = Aquamarine.sortBalance();
                    for (let i = 0; i < 5 && i < a.length; i++) {
                        try {
                            let c = await a[i].getUserInfo(chat.Channel);
                            if (isNullOrUndefined(c))
                                continue;
                            let d = {};
                            if (c.isOpenUser() && (c as OpenChatUserInfo).hasOpenProfile()) {
                                let link = await (c as OpenChatUserInfo).getOpenLink();
                                d = { LPC: link.LinkURL, LMO: link.LinkURL }
                            }
                            s['C']['ITL'].push({ TD: { T: c.Nickname, D: `${a[i].balance}원` }, TH: (isNullOrUndefined(c.ProfileImageURL)) ? undefined : { W: 200, H: 200, SC: 1, THU: c.ProfileImageURL }, L: d });
                        }
                        catch { }
                    }
                    let b = new CustomAttachment();
                    b.readAttachment(s);
                    chat.replyTemplate(new AttachmentTemplate(b));
                }
                    break;
                case '알림': {
                    Aquamarine.getUser(chat.Sender.Id, chat.Channel).alart = !Aquamarine.getUser(chat.Sender.Id, chat.Channel).alart;
                    chat.replyText(`레벨업 알림을 ${Aquamarine.getUser(chat.Sender.Id, chat.Channel).alart ? '켰' : '껐'}습니다`);
                }
                    break;
                case '도움말': {
                    chat.replyText(new ChatMention(chat.Channel.getUserInfo(chat.Sender)), `${'\u200b'.repeat(500)}
${KakaoBot.prefix}${this.command} - 프로필을 확인합니다
${KakaoBot.prefix}${this.command} <맨션> - 맨션한 유저의 프로필을 불러옵니다
${KakaoBot.prefix}${this.command} 레벨 - 이 방의 레벨 순위를 불러옵니다
${KakaoBot.prefix}${this.command} 레벨전체 - 모든 방의 레벨 순위를 불러옵니다
${KakaoBot.prefix}${this.command} 돈 - 이 방의 돈 순위를 불러옵니다
${KakaoBot.prefix}${this.command} 돈전체 - 모든 방의 돈 순위를 불러옵니다`);
                }
                    break;
                default: {
                    if (chat.getMentionContentList().length < 1)
                        this.HandlePrefix(chat);
                    else {
                        let mention = chat.getMentionContentList()[0].UserId;
                        let user = Aquamarine.getUser(mention, chat.Channel);
                        let info = chat.Channel.getUserInfoId(mention);
                        let ex = user.level;
                        let a = {
                            P: {
                                TP: CustomType.FEED, ME: `${info.Nickname}님의 프로필`,
                                SID: 'GKB', DID: 'GKB',
                                SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                                SL: {},
                                VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                            },
                            C: {
                                THC: 1,
                                TI: {
                                    TD: {
                                        T: `Lv.${ex.level}(${ex.remain}/${ex.next})`,
                                        D: `잔고: ${user.balance}`
                                    }
                                },
                                PR: {
                                    TD: { T: info.Nickname },
                                    TH: { THU: info.FullProfileImageURL, W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                                }
                            }
                        }
                        let b = new CustomAttachment()
                        b.readAttachment(a);
                        chat.replyTemplate(new AttachmentTemplate(b));
                    }
                    break;
                }
            }
        }
    }

    export class Attendance extends CommandEvent {
        readonly command = '출석';
        readonly aliases = ['ㅊㅊ', '\u200bㅊㅊ']; //TODO:to without prefix
        readonly description = `${KakaoBot.prefix}${this.command} 도움말`;

        HandlePrefix(chat: Chat) {
            let b = Aquamarine.getUser(chat.Sender.Id, chat.Channel).issueAtd(chat.Channel);
            if (isNullOrUndefined(b)) {
                let sl = Aquamarine.sortAtdLocal(chat.Channel);
                let sg = Aquamarine.sortAttendance();
                let user = Aquamarine.getUser(chat.Sender.Id, chat.Channel);
                let info = chat.Channel.getUserInfo(chat.Sender);
                let b = {
                    P: {
                        TP: CustomType.FEED, ME: `출석 랭킹`, SID: 'GKB', DID: 'GKB',
                        SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                        SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                    },
                    C: {
                        THC: 1,
                        TI: { TD: { T: `${info.Nickname}`, D: `로컬:${sl.indexOf(user) + 1}등(인원:${sl.length}명)|전체:${sg.indexOf(user) + 1}등(인원:${sg.length}명)` } },
                        PR: { TD: { T: info.Nickname }, TH: { THU: info.FullProfileImageURL, W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL } }
                    }
                }
                let c = new CustomAttachment();
                c.readAttachment(b);
                chat.replyTemplate(new AttachmentTemplate(c));
            }
            else {
                chat.replyText(`출석완료(${b.l}등,전체 ${b.g}등)`);
                Aquamarine.getUser(chat.Sender.Id, chat.Channel).issueExp(100, chat.Channel);
            }
        }
        async HandleArgsAsync(chat: Chat, args: Array<string>) {
            switch (args[0]) {
                case '랭킹':
                case '순위': {
                    let s = {
                        P: {
                            TP: 'List', ME: '출석 순위표', SID: 'GKB', DID: 'GKB',
                            SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                            SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                        },
                        C: { THC: 1, HD: { TD: { T: '출석 순위(로컬)' } }, ITL: [] }
                    }

                    let a = Aquamarine.sortAtdLocal(chat.Channel);
                    for (let i = 0; i < 5 && i < a.length; i++) {
                        try {
                            let c = await a[i].getUserInfo(chat.Channel);
                            if (isNullOrUndefined(c))
                                continue;
                            let d = {};
                            if (c.isOpenUser() && (c as OpenChatUserInfo).hasOpenProfile()) {
                                let link = await (c as OpenChatUserInfo).getOpenLink();
                                d = { LPC: link.LinkURL, LMO: link.LinkURL }
                            }
                            s['C']['ITL'].push({ TD: { T: c.Nickname, D: a[i].atdAt.toLocaleTimeString() }, TH: (isNullOrUndefined(c.ProfileImageURL)) ? undefined : { W: 200, H: 200, SC: 1, THU: c.ProfileImageURL }, L: d });
                        }
                        catch { }
                    }
                    let b = new CustomAttachment();
                    b.readAttachment(s);
                    chat.replyTemplate(new AttachmentTemplate(b));
                    break;
                }
                case '전체랭킹':
                case '전체순위': {
                    let s = {
                        P: {
                            TP: 'List', ME: '전체 출석 순위표', SID: 'GKB', DID: 'GKB',
                            SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                            SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                        },
                        C: { THC: 1, HD: { TD: { T: '출석 순위(전체)' } }, ITL: [] }
                    }

                    let a = Aquamarine.sortAttendance();
                    for (let i = 0; i < 5 && i < a.length; i++) {
                        try {
                            let c = await a[i].getUserInfo(chat.Channel);
                            if (isNullOrUndefined(c))
                                continue;
                            let d = {};
                            if (c.isOpenUser() && (c as OpenChatUserInfo).hasOpenProfile()) {
                                let link = await (c as OpenChatUserInfo).getOpenLink();
                                d = { LPC: link.LinkURL, LMO: link.LinkURL }
                            }
                            s['C']['ITL'].push({ TD: { T: c.Nickname, D: a[i].atdAt.toLocaleTimeString() }, TH: (isNullOrUndefined(c.ProfileImageURL)) ? undefined : { W: 200, H: 200, SC: 1, THU: c.ProfileImageURL }, L: d });
                        }
                        catch { }
                    }
                    let b = new CustomAttachment();
                    b.readAttachment(s);
                    chat.replyTemplate(new AttachmentTemplate(b));
                    break;
                }
                case '도움말': {
                    chat.replyText(new ChatMention(chat.Channel.getUserInfo(chat.Sender)), `${'\u200b'.repeat(500)}
${KakaoBot.prefix}${this.command} 랭킹 - 이 방의 출석랭킹을 불러옵니다
${KakaoBot.prefix}${this.command} 전체랭킹 - 모든 방의 출석랭킹을 불러옵니다`);
                    break;
                }
                default:
                    this.HandlePrefix(chat);
                    break;
            }
        }
    }

    export class ChatExp extends ChatEvent {
        Handle(chat: Chat) {
            if (chat.Channel.Type != ChannelType.OPENCHAT_GROUP)
                return;
            Aquamarine.getUser(chat.Sender.Id, chat.Channel).issueExp(Math.min(Math.max(Math.floor(chat.Text.length / 10), 1), 100), chat.Channel);
        }
    }

    //TODO:Optimization UNCOMPLATE
    export class Stock extends CommandEvent {
        readonly command = '주식';
        readonly aliases = [];
        readonly description = `주식 커맨드, 자세한 정보:${KakaoBot.prefix}${this.command}`;

        HandlePrefix(chat: Chat) {
            chat.replyText(new ChatMention(chat.Channel.getUserInfo(chat.Sender)), `${'\u200b'.repeat(500)}
${KakaoBot.prefix}${this.command} 정보 <회사이름> - 주식회사를 검색합니다
${KakaoBot.prefix}${this.command} 구매 <회사이름(띄어쓰기 안됨)> <수량> - 주식을 구매합니다
${KakaoBot.prefix}${this.command} 판매 <회사이름(띄어쓰기 안됨)> <수량> - 주식을 판매합니다
${KakaoBot.prefix}${this.command} 보유 - 주식 보유량을 불러옵니다`);
        }
        async HandleArgsAsync(chat: Chat, args: Array<string>) {
            switch (args[0]) {
                case '정보': {
                    if (args.length < 2)
                        chat.replyText('올바른 이름을 입력해주세요');
                    else {
                        try {
                            let s = { P: { TP: CustomType.CAROUSEL, ME: '주식정보', SID: 'GKB', DID: 'GKB', SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0' }, C: { CTP: CustomType.FEED, CIL: [] } };
                            let a = await Aquamarine.Stock.searchName(args.slice(1).join(' '));
                            for (let i = 0; i < 8 && i < a.length; i++) {
                                s.C.CIL.push((await a[i].kaling()).C);
                            }
                            let b = new CustomAttachment();
                            b.readAttachment(s);
                            chat.replyTemplate(new AttachmentTemplate(b));
                        }
                        catch (e) {
                            chat.replyText(`에러발생:${e}`);
                            KakaoBot.LogError(e);
                        }
                    }
                    break;
                }
                case '매수':
                case '구매': {
                    if (args.length < 2)
                        chat.replyText('올바른 이름을 입력해주세요');
                    else {
                        try {
                            let a = parseInt(args[2]);
                            if (isNaN(a) || a < 1)
                                a = 1;
                            let b = (await Aquamarine.Stock.searchName(args[1]))[0];

                            if (isNullOrUndefined(b))
                                chat.replyText('알 수 없는 주식입니다.');
                            else {
                                let c = await b.getInfo();
                                if (c.price * a > Aquamarine.getUser(chat.Sender.Id, chat.Channel).balance)
                                    chat.replyText('돈이 부족합니다');
                                else {
                                    if (!isNullOrUndefined(Aquamarine.getUser(chat.Sender.Id, chat.Channel).stocks.find(e => e.id == b.id)))
                                        Aquamarine.getUser(chat.Sender.Id, chat.Channel).stocks.find(e => e.id == b.id).amount += a;
                                    else {
                                        b.amount = a;
                                        Aquamarine.getUser(chat.Sender.Id, chat.Channel).stocks.push(b);
                                    }
                                    chat.replyText(`주식 ${c.name}(${c.id})을(를) ${a}주(${c.price * a}원) 구매했습니다`);
                                    Aquamarine.getUser(chat.Sender.Id, chat.Channel).balance -= c.price * a;
                                }
                            }
                        }
                        catch (e) {
                            chat.replyText(`에러발생:${e}`);
                        }
                    }
                }
                    
                    break;
                case '매도':
                case '판매':
                    if (args.length < 2)
                        chat.replyText('올바른 이름을 입력해주세요');
                    else {
                        try {
                            let a = parseInt(args[2]);
                            if (isNaN(a) || a < 1)
                                a = 1;
                            if (isNullOrUndefined(Aquamarine.getUser(chat.Sender.Id, chat.Channel).stocks.find(e => e.name == args[1] || e.id == args[1])))
                                chat.replyText('보유하고 있지 않은 주식입니다.');
                            else {
                                let b = Math.min(a, Aquamarine.getUser(chat.Sender.Id, chat.Channel).stocks.find(e => e.name == args[1] || e.id == args[1]).amount)
                                let c = await Aquamarine.getUser(chat.Sender.Id, chat.Channel).stocks.find(e => e.name == args[1] || e.id == args[1]).getInfo();
                                Aquamarine.getUser(chat.Sender.Id, chat.Channel).balance += c.price * b;
                                Aquamarine.getUser(chat.Sender.Id, chat.Channel).stocks.find(e => e.name == args[1] || e.id == args[1]).amount -= b;
                                chat.replyText(`주식 ${c.name}(${c.id})을(를) ${b}주(${c.price * b}) 판매했습니다`);
                            }
                        }
                        catch (e) {
                            chat.replyText(`에러발생:${e}`);
                        }
                    }
                    break;
                case '보유':
                case '보유량':
                    try {
                        let a = Aquamarine.getUser(chat.Sender.Id, chat.Channel).stocks.filter(e => e.amount > 0);
                        if (a.length < 1)
                            chat.replyText('보유중인 주식이 없습니다');
                        else {
                            let s = {
                                P: {
                                    TP: CustomType.CAROUSEL, ME: '주식보유량', SID: 'GKB', DID: 'GKB',
                                    SL: {},
                                    VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                                },
                                C: {
                                    CTP: CustomType.FEED,
                                    CIL: []
                                }
                            };
                            for (let i = 0; i < 8 && i < a.length; i++) {
                                s.C.CIL.push((await a[i].kalingBot()).C);
                            }
                            let b = new CustomAttachment();
                            b.readAttachment(s);
                            chat.replyTemplate(new AttachmentTemplate(b));
                        }
                    }
                    catch (e) {
                        chat.replyText(`에러 발생:${e}`);
                    }
                    break;
                default:
                    this.HandlePrefix(chat);
                    break;
            }
        }
    }
}

export namespace Aquamarine {
    const savepath = './dat/aquamarine'; //RUN AT app.ts;js

    export var users: Array<User> = []; //EXPORT IS TEMP
    export var active: boolean = false;

    export function newUser(u: Long, cacheR: ChatChannel): User {
        let a = new User(u, cacheR);
        a.addRoom(cacheR);
        users.push(a); //TODO
        return a;
    }
    export function getUser(u: Long, cacheR: ChatChannel) {
        if (!active)
            return new User(u, cacheR); //FAKE OBJECT

        let i = users.findIndex(e => e.isMe(u, cacheR));

        if (i == -1)
            return newUser(u, cacheR);
        else {
            users[i].addRoom(cacheR);
            return users[i];
        }
    }

    export function sortAttendance(): Array<User> {
        return sortCache.getAtd();
    }
    export function sortAtdLocal(c: ChatChannel): Array<User> {
        return sortAttendance().filter(e => e.isJoined(c));
    }

    export function sortLevel(): Array<User> {
        return sortCache.getLevel();
    }
    export function sortLvLocal(c: ChatChannel): Array<User> {
        return sortLevel().filter(e => e.isJoined(c));
    }

    export function sortBalance(): Array<User> {
        return sortCache.getBalance();
    }
    export function sortBaLocal(c: ChatChannel): Array<User> {
        return sortBalance().filter(e => e.isJoined(c));
    }
    export namespace sortCache{
        var atdCacheUpdateAt:Date = null;
        var atdCache:Array<User> = [];
        export function updateAtd(){
            atdCache = users
                .filter(e => !isNullOrUndefined(e.atdAt) && e.atdAt.toLocaleDateString() == new Date().toLocaleDateString()) //check Atd, Atd is today
                .sort((a, b) => a.atdAt.getTime() - b.atdAt.getTime());
            atdCacheUpdateAt = new Date();
        }
        export function getAtd(){
            if(isNullOrUndefined(atdCacheUpdateAt))
                updateAtd();
            return atdCache;
        }

        const outTimeMils = 300000;

        var levelCacheUpdateAt:Date = null;
        var levelCache:Array<User> = [];
        export function updateLevel(){
            levelCache = users
                .sort((a, b) => b.exp - a.exp);
            levelCacheUpdateAt = new Date();
        }
        export function getLevel(){
            if(isNullOrUndefined(levelCacheUpdateAt) || (Date.now() - levelCacheUpdateAt.getTime()) >= outTimeMils)
                updateLevel();
            return levelCache;
        }

        var balanceCacheUpdateAt: Date = null;
        var balanceCache: Array<User> = [];
        export function updateBalance() {
            balanceCache = users
                .sort((a, b) => b.balance - a.balance);
            balanceCacheUpdateAt = new Date();
        }
        export function getBalance() {
            if (isNullOrUndefined(balanceCacheUpdateAt) || (Date.now() - balanceCacheUpdateAt.getTime()) >= outTimeMils)
                updateBalance();
            return balanceCache;
        }
    }

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
            let a = jsonfile.readFileSync(`${savepath}/saves.json`);
            let cache = [];
            for (let i = 0; i < a.length; i++) {
                try {
                    cache.push(await User.FromJson(a[i]));
                }
                catch (e) {
                    KakaoBot.LogError(e);
                }
            }
            users = cache;
            active = true;
        }
        catch (e) { KakaoBot.LogError(e); }
    }
    export function SaveData() {
        /*
        save guide
        
        1.save data to default file
        2.save data to 'data_year_month_day_daysecond.json'
        */
        var a = users.map(e => e.toJson);
        jsonfile.writeFileSync(`${savepath}/saves.json`, a, { spaces: 2, EOL: '\r\n' });

        let d = new Date();
        jsonfile.writeFileSync(`${savepath}/archive/${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}D${d.getHours()}.${d.getMinutes()}.${d.getSeconds()}T${d.getMilliseconds()}Z.json`, a, { spaces: 2, EOL: '\r\n' });
    }

    export class User {

        //kakao field
        user: Long;
        isOpen: boolean = false;

        async getUserInfo(c: ChatChannel): Promise<UserInfo> {
            try {
                if (this.isOpen)
                    return (await KakaoBot.client.OpenLinkManager.get(this.user)).LinkOwnerInfo;
                else if (!this.cacheRoom.includes(c))
                    return await this.vaildFirst.getLatestUserInfoId(this.user);
                else
                    return await c.getLatestUserInfoId(this.user);
            }
            catch{
                return null;
            }
        }

        //kakao cache
        cacheRoom: Array<ChatChannel> = [];
        addRoom(c: ChatChannel) { if (isNullOrUndefined(this.cacheRoom.find(e => e.Id.equals(c.Id)))) this.cacheRoom.push(c); }
        get vaildFirst() { return this.cacheRoom.filter(e => KakaoBot.client.ChannelManager.has(e.Id) && KakaoBot.client.ChannelManager.get(e.Id).hasUserInfo(this.user))[0]; }

        //level field
        exp: number = 0;
        alart: boolean = true;
        get level(): ExpInfo { return CalculateExp(this.exp); }
        issueExp(i: number, issueroom?: ChatChannel): { up: boolean, b: number, n: number } {
            var a = this.level.level;
            this.exp += i;
            if (this.level.level != a) {
                this.status.LevelUp(Math.max(this.level.level - a, 0), this.level.level);
                let lvupR = 0;
                for (let index = 0; index < Math.max(this.level.level - a, 0); index++)
                    lvupR += 50000 + ((this.level.level - index) * 1000 * Math.floor((this.level.level - index) / 10));
                this.balance += lvupR;

                if (!isNullOrUndefined(issueroom) && this.alart) {
                    (async () => {
                        let inf = await this.getUserInfo(issueroom);
                        let b = {
                            P: {
                                TP: CustomType.FEED, ME: `레벨업`, SID: 'GKB', DID: 'GKB',
                                SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                                SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                            },
                            C: {
                                THC: 1,
                                TI: { TD: {
                                        T: `Lv.${a} -> Lv.${this.level.level}`,
                                        D: `레벨업! 잔고 ${lvupR}원이 추가되었습니다 (수신 끄기/켜기: '${KakaoBot.prefix}${new AquamarineChat.Profile().command} 알림')`
                                    } },
                                PR: { TD: { T: inf.Nickname }, TH: { THU: inf.FullProfileImageURL, W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL } }
                            }
                        }
                        let c = new CustomAttachment();
                        c.readAttachment(b);
                        issueroom.sendTemplate(new AttachmentTemplate(c));
                    })();
                }
            }
            return { up: this.level.level != a, b: a, n: this.level.level };
        }

        //attendance field
        atdAt: Date = null;
        issueAtd(c: ChatChannel) {
            if (!isNullOrUndefined(this.atdAt) && this.atdAt.toLocaleDateString() == new Date().toLocaleDateString())
                return null;
            else {
                this.atdAt = new Date();
                sortCache.updateAtd();
                let a = sortAttendance();
                this.balance += 150000 + ((200 - a.indexOf(this)) * 1000)
                return { g: a.indexOf(this) + 1, l: a.filter(e => e.isJoined(c)).indexOf(this) + 1 };
            }
        }

        //finance field
        balance: number = 100000;
        stocks: Array<Stock> = [];

        //RPG field
        status: Coral.UserStatus = Coral.UserStatus.CreateNew(this.level.level);

        constructor(u: Long, f?: ChatChannel | boolean) {
            if (!isNullOrUndefined(f) && f instanceof ManagedBaseChatChannel && f.isOpenChat() && (f as ManagedOpenChatChannel).getUserInfoId(u).hasOpenProfile()) {
                this.user = (f.getUserInfoId(u) as OpenChatUserInfo).ProfileLinkId;
                this.isOpen = true;
            }
            else {
                this.user = u;
                if (!isNullOrUndefined(f) && isBoolean(f))
                    this.isOpen = f;
            }
        }
        isMe(u: Long, f: ChatChannel): boolean {
            try {
                if (this.isOpen)
                    return (f.Type == ChannelType.OPENCHAT_GROUP || f.Type == ChannelType.OPENCHAT_DIRECT) &&
                        (f as OpenChatChannel).getUserInfoId(u).hasOpenProfile() &&
                        (f.getUserInfoId(u) as OpenChatUserInfo).ProfileLinkId.equals(this.user);
                else
                    return u.equals(this.user);
            }
            catch{
                return false;
            }
        }
        isJoined(c: ChatChannel): boolean {
            if (this.isOpen)
                return c.isOpenChat() && (c as OpenChatChannel).getUserInfoList().findIndex(e => !isNullOrUndefined(e.ProfileLinkId) && this.user.equals(e.ProfileLinkId)) != -1;
            else
                return c.hasUserInfo(this.user);
        }

        static async FromJson(j: UserRaw) {
            let a = new User(Long.fromString(j.user), (isNullOrUndefined(j.isOpen)) ? false : j.isOpen);
            a.cacheRoom = j.cacheChannel
                .map(e => KakaoBot.client.ChannelManager.get(Long.fromString(e)))
                .filter(e => { return !isNullOrUndefined(e) && a.isJoined(e); });
            a.atdAt = (isNullOrUndefined(j.attendance)) ? null : new Date(j.attendance);
            a.exp = j.exp;
            a.balance = j.finance.money;
            let b = [];
            for (let it = 0; it < j.finance.stocks.length; it++) {
                let st = await Stock.fromId(j.finance.stocks[it].id); st.amount = j.finance.stocks[it].amount;
                b.push(st);
            }
            a.stocks = b;

            a.alart = isNullOrUndefined(j.alart) ? true : j.alart;
            a.status = isNullOrUndefined(j.status) ? Coral.UserStatus.CreateNew(a.level.level) : Coral.UserStatus.FromRaw(j.status);
            return a;
        }
        get toJson(): UserRaw {
            return {
                user: this.user.toString(),
                isOpen: this.isOpen,
                cacheChannel: this.cacheRoom.map(e => e.Id.toString()),
                exp: this.exp,
                attendance: (isNullOrUndefined(this.atdAt)) ? null : this.atdAt.toString(),
                finance: {
                    money: this.balance,
                    stocks: this.stocks.map(e => {return { id:e.id, amount:e.amount }})
                },
                alart: this.alart,
                status: this.status.JSON
            }
        }
    }
    export interface UserRaw {
        user: string,
        isOpen: boolean,
        cacheChannel: Array<string>,
        exp: number,
        attendance: string,
        finance: {
            money: number;
            stocks: Array<{id:string,amount:number}>
        },
        //EXTENDS
        alart?: boolean,
        //RPGS
        status?: Coral.StatusRaw
    }
    export function CalculateExp(exp: number): ExpInfo {
        return {
            level: Math.floor(Math.sqrt(exp / 10)) + 1,
            remain: exp - (Math.pow(Math.floor(Math.sqrt(exp / 10)), 2) * 10),
            next: (Math.pow(Math.floor(Math.sqrt(exp / 10)) + 1, 2) * 10) - (Math.pow(Math.floor(Math.sqrt(exp / 10)), 2) * 10),
            total: exp
        }
    }
    
    export class Stock {
        static readonly itemcode = 'https://api.finance.naver.com/service/itemSummary.nhn?itemcode=';
        static readonly search = 'https://m.stock.naver.com/api/json/search/searchListJson.nhn?keyword=';

        //info field
        id: string;
        name: string;

        //inBot field
        amount: number = 0;

        constructor(id, name) {
            this.id = id;
            this.name = name;
        }

        static async fromId(id: string): Promise<Stock> {
            if (StockCache.stocknames.has(id))
                return new Stock(id, StockCache.stocknames.get(id));
            else {
                let a = await GET.json(`${Stock.search}${id}`);
                if (a['result']['d'].length < 1)
                    return new Stock(id, 'LOADERROR');
                StockCache.stocknames.set(a['result']['d'][0]['cd'], a['result']['d'][0]['nm']);
                StockCache.updateInfo({ name: a['result']['d'][0]['nm'], id: a['result']['d'][0]['cd'], different: a['result']['d'][0]['cv'], price: a['result']['d'][0]['nv'] });
                return new Stock(a['result']['d'][0]['cd'], a['result']['d'][0]['nm']);
            }
        }
        static async searchName(name: string): Promise<Array<Stock>> {
            let cache = StockCache.getSearch(name);
            if (!isNullOrUndefined(cache))
                return cache;
            else {
                let a = await GET.json(`${Stock.search}${name}`);
                let result = a['result']['d'].map(e => { StockCache.updateInfo({ name: e['nm'], id: e['cd'], different: e['cv'], price: e['nv'] }); return new Stock(e['cd'], e['nm']); });
                StockCache.updateSearch(name, result);
                return result;
            }
        }

        async getInfo(): Promise<StockInfo> {
            let c = StockCache.getInfo(this.id);
            if (!isNullOrUndefined(c))
                return c;

            let a = await GET.json(`${Stock.itemcode}${this.id}`);
            let res = {
                name: this.name,
                id: this.id,
                price: a['now'],
                different: a['diff']
            };
            StockCache.updateInfo(res);
            return res;
        }
        async isVaild(): Promise<boolean> {
            try {
                await GET.normal(`${Stock.itemcode}${this.id}`);
                return true;
            }
            catch (e) {
                return false;
            }
        }
        async kaling(): Promise<any> {
            let a = await this.getInfo();
            return {
                P: {
                    TP: CustomType.FEED, ME: `${this.name} 주식정보`,
                    SID: 'GKB', DID: 'GKB',
                    SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                    SL: {},
                    VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                },
                C: {
                    THC: 1,
                    TI: {
                        TD: {
                            T: `${a.price}(${Math.abs(a.different)} ${(a.different >= 0) ? '▲' : '▼'})`,
                        }
                    },
                    PR: {
                        TD: { T: `${this.name}(${this.id})` },
                        TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                    }
                }
            }
        }
        async kalingBot(): Promise<any> {
            let a = await this.getInfo();
            return {
                P: {
                    TP: CustomType.FEED, ME: `${this.name} 주식정보`,
                    SID: 'GKB', DID: 'GKB',
                    SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                    SL: {},
                    VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                },
                C: {
                    THC: 1,
                    TI: {
                        TD: {
                            T: `${a.price}(${Math.abs(a.different)} ${(a.different > 0) ? '▲' : '▼'})`,
                            D: `보유량:${this.amount}`
                        }
                    },
                    PR: {
                        TD: { T: `${this.name}(${this.id})` },
                        TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                    }
                }
            }
        }
    }
    export interface StockInfo {
        name: string;
        id: string;
        price: number;
        different: number; //it can negative number
    }

    export interface ExpInfo {
        level: number,
        remain: number,
        next: number,
        total: number
    }

    export namespace StockCache {
        export const stocknames: Map<string, string> = new Map(); //<ID,NAME>
        export const stockInfos: Map<string, InfoCache> = new Map(); //<ID,INFO>
        export const stockSearches: Map<string, SearchCache> = new Map(); //<searchname,STOCKS>
        export const outTimeMils = 300000;
        export function getInfo(id: string) {
            return (!stockInfos.has(id) || (new Date().getTime() - stockInfos.get(id).at.getTime()) > outTimeMils) ? null : stockInfos.get(id).info;
        }
        export function updateInfo(info: StockInfo) {
            stockInfos.set(info.id, { info: info, at: new Date() });
        }
        export function getSearch(search: string) {
            if (!stockSearches.has(search) || (new Date().getTime() - stockSearches.get(search).at.getTime()) > outTimeMils)
                return null;
            let a = stockSearches.get(search).stock;
            return a.map(f => new Stock(f.id, f.name));
        }
        export function updateSearch(search: string, result: Array<Stock>) {
            stockSearches.set(search, { stock: result, at: new Date() });
        }

        export interface InfoCache {
            info: StockInfo;
            at: Date;
        }
        export interface SearchCache {
            stock: Array<Stock>;
            at: Date;
        }
    }
}