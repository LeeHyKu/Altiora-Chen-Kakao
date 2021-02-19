import { CommandEvent } from "../Event";
import { Chat, OpenChatChannel, ChannelType, Long, AttachmentTemplate, ChatMention, OpenChatUserInfo, ReplyAttachment, LinkReactionType, OpenLinkType, OpenProfileType, StatusCode } from "@storycraft/node-kakao";
import { KakaoBot } from "../KakaoBot";
import { isNullOrUndefined } from "util";

export namespace ForUser {
    export class CallManager extends CommandEvent {
        readonly command = '관리자호출';
        readonly aliases = ['관', '호출'];
        readonly description = '이 방에 있는 모든 관리자를 호출합니다. 오픈 채팅에서만 사용할 수 있습니다';

        Handle(chat: Chat) {
            if (chat.Channel.Type != ChannelType.OPENCHAT_GROUP)
                chat.replyText('오픈채팅에서만 사용가능합니다');
            else {
                chat.replyText(...chat.Channel.getUserInfoList().filter(e => (chat.Channel as OpenChatChannel).canManageChannelId(e.Id)).map(e => new ChatMention(e)))
            }
        }
    }
    export class HeartReactor extends CommandEvent {
        readonly command = '하트';
        readonly description = '하트를 줍니다. 여러번 사용할 수 있지만 한번만 효과가 있으며, 오픈 채팅에서 오픈 프로필일때만 사용이 가능합니다';

        async HandleAsync(chat: Chat) {
            if (chat.Channel.Type != ChannelType.OPENCHAT_GROUP)
                chat.replyText('오픈채팅에서만 사용가능합니다');
            else if (!(chat.Channel.getUserInfo(chat.Sender) as OpenChatUserInfo).hasOpenProfile())
                chat.replyText('오픈 프로필을 사용해주세요');
            else {
                chat.Channel.Client.OpenLinkManager.setLinkReacted((await (chat.Channel.getUserInfo(chat.Sender) as OpenChatUserInfo).getOpenLink()).LinkId, LinkReactionType.NORMAL);
                chat.Channel.sendTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat), `${chat.Channel.getUserInfo(chat.Sender).Nickname}님,
하트 리액션 완료되었습니다.
${new Date()}`));
            }
        }
    }
    export class RandomUser extends CommandEvent {
        readonly command = '유저뽑기';
        readonly aliases = ['랜덤유저']
        readonly description = '방의 모든 유저중 한명 뽑습니다. @을 사용하여 언급을 할 경우 그 사용자 중에서 한명을 뽑습니다';

        Handle(chat: Chat) {
            if (chat.getMentionContentList().length < 1) {
                let a = chat.Channel.getUserInfoList();
                chat.replyText('랜덤유저:', new ChatMention(a[Math.floor(Math.random() * a.length)]));
            }
            else {
                let a = chat.getMentionContentList();
                chat.replyText('랜덤유저:', new ChatMention(chat.Channel.getUserInfoId(a[Math.floor(Math.random() * a.length)].UserId)));
            }
        }
    }
}

export namespace ForManager {
    export class Kick extends CommandEvent {
        readonly command = '킥';
        readonly aliases = [];
        readonly description = '유저를 킥합니다. 봇한테 부방장 역할이 부여되어 있어야 하며, 방장/부방장만 사용할 수 있습니다. @을 사용하여 내보낼 사용자를 지정합니다';

        HandleArgs(chat: Chat, args: Array<string>) {
            if (chat.Channel.Type != ChannelType.OPENCHAT_GROUP)
                chat.replyText('오픈채팅에서만 사용가능합니다');
            else if (!(chat.Channel as OpenChatChannel).canManageChannel(chat.Sender))
                chat.replyText('권한이 없습니다');
            else if (!(chat.Channel as OpenChatChannel).canManageChannel(chat.Sender.Client.ClientUser))
                chat.replyText('봇이 부방장이 아닙니다');
            else if (chat.getMentionContentList().length == 0)
                chat.replyText('@을 사용해 유저를 맨션해 주세요');
            else {
                chat.getMentionContentList().forEach(e => (chat.Channel as OpenChatChannel).kickMemberId(e.UserId));
                chat.replyText('내보내기 완료');
            }
        }
    }
    export class Hide extends CommandEvent {
        //TODO
    }
}

export namespace ForDeveloper {
    export const dev = [];
    export class Simulate extends CommandEvent {
        readonly command = '시뮬레이션';
        readonly aliases = ['>', '시뮬', 'eval'];
        readonly whitelist = dev;
        readonly description = '개발자용';

        HandleArgs(chat: Chat, args: Array<string>) {
            try {
                let a = new Function('chat', 'client', args.join(' '))(chat, KakaoBot.client);
                if (!isNullOrUndefined(a))
                    chat.replyText(a);
            }
            catch (e) {
                chat.replyText(`${e.prototype.name}${'\u0000'.repeat(500)}${e}`);
            }
        }
    }
    export class Join extends CommandEvent {
        readonly command = '들어가기';
        readonly aliases = ['goto'];
        readonly whitelist = dev;
        readonly description = '개발자용입니다';

        readonly profileLink = new Long(0, 0); //검열됨

        async HandleArgsAsync(chat: Chat, args: Array<string>) {
            let a = await chat.Sender.Client.OpenLinkManager.getFromURL(args[0]);
            if (isNullOrUndefined(a) || a.LinkType == OpenLinkType.PROFILE) //profile, is ness'?
                chat.replyText('err:알 수 없는 링크');
            try {
                let b = await chat.Sender.Client.ChannelManager.joinOpenChannel(a.LinkId, { type: OpenProfileType.OPEN_PROFILE, profileLinkId: this.profileLink });
                if (b.status != StatusCode.SUCCESS)
                    throw new Error(`입장실패, ${b.status}`);
            }
            catch (e) {
                chat.replyText(`err:${e}`);
            }
        }
    }
}
