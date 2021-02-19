import { Chat, Long, ChatChannel, ChatUser, FeedChat, OpenJoinFeed, InviteFeed, ChannelType } from '@storycraft/node-kakao';

export class ChatEvent {
    whitelist?: Array<Long>; //ROOM
    blacklist?: Array<Long>; //ROOM
    whiteuser?: Array<Long>;
    blackuser?: Array<Long>;
    channelType?: ChannelType | Array<ChannelType>;

    Handle(chat: Chat) { }
    async HandleAsync(Chat: Chat) { }
}

export class CommandEvent {
    readonly command: string = this.constructor.name;
    readonly aliases?: Array<string>;
    readonly description?: string;
    readonly argdescription?: Array<CommandDescription>;
    readonly invisable?: boolean;
    whitelist?: Array<Long>; //USER
    blacklist?: Array<Long>; //USER
    whiteroom?: Array<Long>;
    blackroom?: Array<Long>;
    channelType?: ChannelType | Array<ChannelType>;

    Handle(chat: Chat) { }
    async HandleAsync(chat: Chat) { }
    HandlePrefix(chat: Chat) { }
    async HandlePrefixAsync(chat: Chat) { }
    HandleArgs(chat: Chat, args: Array<string>) { }
    async HandleArgsAsync(chat: Chat, args: Array<string>) { }
}

export interface CommandDescription {
    args: string|Array<string>; //READONLY
    description: string; //READONLY
}

export class JoinEvent {
    whitelist?: Array<Long>; //ROOM
    blacklist?: Array<Long>; //ROOM

    Handle(channel: ChatChannel, user: ChatUser, feed?: FeedChat<OpenJoinFeed | InviteFeed>) { }
    async HandleAsync(channel: ChatChannel, user: ChatUser, feed?: FeedChat<OpenJoinFeed | InviteFeed>) { }
}