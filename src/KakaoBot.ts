import { TalkClient, Chat, Long, ChatType, ChatChannel, ChatUser, OpenJoinFeed, InviteFeed, FeedChat, LongTextAttachment, AttachmentTemplate, ChatMention, ReplyChat, ChannelType, CustomAttachment, CustomType, CustomImageCropStyle, OpenLinkType, OpenProfileType, StatusCode } from '@storycraft/node-kakao';
import * as readline from 'readline';
import * as Config from '../res/Config.json';
import { CommandEvent, ChatEvent, JoinEvent } from './Event';
import { isNullOrUndefined } from 'util';
import inquirer from 'inquirer';
import { CustomSetting } from './Setting';

export namespace KakaoBot {
/* CORE MEMBER */
    export const client = new TalkClient(Config.loginid);

    export var readstream = readline.createInterface(process.stdin);

    export async function login() {
        client
            .on('message', async (chat: Chat) => { try { this.ChatEvent(chat); } catch (e) { console.log(e); } })
            .on('user_join', async (channel: ChatChannel, user: ChatUser, feed?: FeedChat<OpenJoinFeed | InviteFeed>) => { try { await JoinEvent(channel, user, feed); } catch (e) { console.log(e); } });

        client.login(Config.id, Config.password, Config.accessid);

        readstream.question('', loop);
    };

    async function loop(s) {
        await Taihou.RUN();
        readstream.close();
        readstream = readline.createInterface(process.stdin)
        readstream.question('', loop);
    }

/* HANDLE EVENT MEMBER */
    export const prefix = '!';

    export const chats: Array<ChatEvent> = [];
    export function addChatEvent(ce: ChatEvent) { chats.push(ce); }

    export const commands: Array<CommandEvent> = [];
    export function addCommandEvent(ce: CommandEvent) { commands.push(ce); }

    export const joins: Array<JoinEvent> = [];
    export function addJoinEvent(je: JoinEvent) { joins.push(je); }

    //CALLBACK ONLY
    export function ChatEvent(chat: Chat)
    {
        if (chat.Sender.isClientUser())
            return;
        chats.forEach(e => {
            (async () => {
                if (
                    /* ALLOW ROUTINE */
                    CustomSetting.getSettings(chat.Channel).disallowEvents.findIndex(f => f == e.constructor.name) == -1 &&
                    /* CHANNELTYPE ROUTINE */
                    (
                        isNullOrUndefined(e.channelType) ||
                        [...e.channelType].includes(chat.Channel.Type)
                    ) && //END CHANNELTYPE ROUTINE
                    /* WHITELIST ROUTINE */
                    (
                        isNullOrUndefined(e.whitelist) ||
                        e.whitelist.findIndex(f => chat.Channel.Id.equals(f)) != -1
                    ) && //END WHITE ROUTINE
                    /* BLACKLIST ROUTINE */
                    (
                        isNullOrUndefined(e.blacklist) ||
                        e.blacklist.findIndex(f => chat.Channel.Id.equals(f)) == -1
                    ) && //END BLACK ROUTINE
                    /* WHITEUSER ROUTINE */
                    (
                        isNullOrUndefined(e.whiteuser) ||
                        e.whiteuser.findIndex(f => chat.Sender.Id.equals(f)) != -1
                    ) && //END WHITEUSER ROUTINE
                    /* BLACKUSER ROUTINE */
                    (
                        isNullOrUndefined(e.blackuser) ||
                        e.blackuser.findIndex(f => chat.Sender.Id.equals(f)) == -1
                    ) //END BLACKUSER ROUTINE
                ) {
                    try {
                        e.HandleAsync(chat);
                        e.Handle(chat);
                    }
                    catch (error) {
                        LogError(`ERROR ISSUE: ${error} at CHATEVENT ${chat.Text}`);
                    }
                }
            })();
        });

        switch (chat.Type) {
            case ChatType.Text:
            case ChatType.Reply:
                commands.forEach(e => {
                    (async () => {
                        if (
                            /* ALLOW ROUTINE */
                            CustomSetting.getSettings(chat.Channel).disallowEvents.findIndex(f => f == e.constructor.name) == -1 &&
                            /* CHANNELTYPE ROUTINE */
                            (
                                isNullOrUndefined(e.channelType) ||
                                [...e.channelType].includes(chat.Channel.Type)
                            ) && //END CHANNELTYPE ROUTINE
                            /* COMMAND ROUTINE */
                            (
                                /* BASIC COMMAND ROUTINE */
                                (
                                    chat.Text.toLowerCase().startsWith(`${prefix}${e.command.toLowerCase()}`) || //BASIC
                                    (e.command.includes('\u200b') && chat.Text.toLowerCase().startsWith(e.command.replace('\u200b', '').toLowerCase())) //IF NON-PREFIX
                                ) || //END BASIC ROUTINE
                                /* ALIASES COMMAND ROUTINE */
                                (
                                    !isNullOrUndefined(e.aliases) &&
                                    e.aliases.findIndex(f =>
                                        chat.Text.toLowerCase().startsWith(`${prefix}${f.toLowerCase()}`) ||
                                        (f.includes('\u200b') && chat.Text.toLowerCase().startsWith(f.replace('\u200b', '').toLowerCase()))
                                    ) != -1
                                ) //END ALIASES ROUTINE
                            ) && //END COMMAND ROUTINE
                            /* LIST ROUTINE */
                            (
                                /* WHITELIST ROUTINE */
                                (
                                    isNullOrUndefined(e.whitelist) ||
                                    e.whitelist.findIndex(f => chat.Sender.Id.equals(f)) != -1
                                ) && //END WHITE ROUTINE
                                /* BLACKLIST ROUTINE */
                                (
                                    isNullOrUndefined(e.blacklist) ||
                                    e.blacklist.findIndex(f => chat.Sender.Id.equals(f)) == -1
                                ) && //END BLACK ROUTINE
                                /* WHITEROOM ROUTINE */
                                (
                                    isNullOrUndefined(e.whiteroom) ||
                                    e.whiteroom.findIndex(f => chat.Channel.Id.equals(f)) != -1
                                ) && //END WHITEROOM ROUTINE
                                /* BLACKROOM ROUTINE */
                                (
                                    isNullOrUndefined(e.blackroom) ||
                                    e.blackroom.findIndex(f => chat.Channel.Id.equals(f)) == -1
                                ) //END BLACKROOM ROUTINE
                            ) //END LIST ROUTINE
                        ) {
                            try {
                                e.HandleAsync(chat);
                                e.Handle(chat);

                                let a = processCommand(chat.Text, e);
                                if (a == '') {
                                    e.HandlePrefixAsync(chat);
                                    e.HandlePrefix(chat);
                                }
                                else {
                                    let sp = a.split(' ');
                                    if (sp[0] == '')
                                        sp.splice(0, 1);
                                    e.HandleArgsAsync(chat, sp);
                                    e.HandleArgs(chat, sp);
                                }
                            }
                            catch (error) {
                                LogError(`ERROR ISSUE: ${error} at '${e.command}'`);
                            }
                            finally {
                                LogInfo(`COMMAND ISSUE: ${chat.Channel.getUserInfo(chat.Sender).Nickname} : ${chat.Text} at ${chat.Channel.Name}`);
                            }
                        }
                    })();
                });
                break;
            default:
                break;
        }
    }
    export async function JoinEvent(channel: ChatChannel, user: ChatUser, feed?: FeedChat<OpenJoinFeed | InviteFeed>) {
        if (user.isClientUser())
            return;

        joins
            .filter(e => CustomSetting.getSettings(channel).disallowEvents.findIndex(f => f == e.constructor.name) == -1 && (isNullOrUndefined(e.whitelist) || !isNullOrUndefined(e.whitelist.find(e => e.equals(channel.Id)))))
            .forEach(e => {
                LogInfo(`USER JOINED CHANNEL`);
                e.HandleAsync(channel, user, feed);
                e.Handle(channel, user, feed);
            });
    }

    //TODO: aliases ISSUE
    function processCommand(text: string, command: CommandEvent) {
        if (text.startsWith(`${prefix}${command.command}`))
            return text.replace(`${prefix}${command.command}`, '');
        else if (command.command.includes('\u200b') && text.startsWith(command.command.replace('\u200b', '')))
            return text.replace(command.command.replace('\u200b', ''), '');
        else if (!isNullOrUndefined(command.aliases)) {
            if (command.aliases.findIndex(e => text.startsWith(`${prefix}${e}`)) != -1)
                return text.replace(command.aliases.find(e => text.startsWith(`${prefix}${e}`)), '');
            else if (command.aliases.findIndex(e => e.includes('\u200b') && text.startsWith(e.replace('\u200b', ''))) != -1)
                return text.replace(command.aliases.find(e => e.includes('\u200b') && text.startsWith(e.replace('\u200b', ''))).replace('\u200b', ''), '');
            else
                return null;
        }
        else
            return null;
    }

/* LOG MENBER */
    export function LogInfo(a?: any) { addlog(`[정보] ${a}`); }
    export function LogWarning(a?: any) { addlog(`[경고] ${a}`); }
    export function LogError(a?: any) { addlog(`[오류] ${a}`); }

    var logs = [];
    export function addlog(a: any) {
        logs.push(a);
        if (!Taihou.isRunning)
            flush();
    }
    function flush() { logs.forEach(e => console.log(e)); logs = []; }

    export namespace SystemCommand {
        export class Help extends CommandEvent {
            readonly command = '도움말';
            readonly aliases = ['h', 'help', 'ㄷ', 'ㅁ', '명령어'];

            HandlePrefix(chat: Chat) {
                chat.replyText(new ChatMention(chat.Channel.getUserInfo(chat.Sender)), '\u200b'.repeat(500), '\n\n',
                    commands.filter(f => isNullOrUndefined(f.invisable) || f.invisable).map(e => `${e.command.includes('\u200b') ? `${e.command.replace('\u200b', '')}` : `${prefix}${e.command}`} ${CustomSetting.getSettings(chat.Channel).disallowEvents.includes(e.constructor.name) ? '(사용불가)' : ''}
${e.description == '' ? '설명없음' : e.description}`).join('\n\n'), '\n\n',
                    `${prefix}${this.command} <명령어> 로 명령어에 대한 자세한 정보를 출력할 수 있습니다`
                );
            }
            HandleArgs(chat: Chat,args: Array<string>) {

            }
        }
    }
    export namespace Taihou {
        export var isRunning = false;
        const actions: Array<Action> = [];
        export function addAction(a: Action) { actions.push(a); }
        export async function RUN() {
            if (isRunning)
                return;
            isRunning = true;
            let a: any = (await inquirer.prompt({
                type: 'list', name: "ACTION", message: "Ch'en", choices: [
                    ...actions.map(e => { return { name: e.name, value: e.Handle } })
                ]
            })).ACTION;

            try {
                await a();
            }
            catch (e) {
                LogError('ERROR ISSUED AT HANDLE CLI');
                addlog(e);
            }
            isRunning = false;
            flush();
            return;
        }

        export const stdPrefix = '.';
        export const stdLeave = [`${stdPrefix}leave`, `${stdPrefix}l`];
        export const stdCancel = [`${stdPrefix}cancel`, `${stdPrefix}c`]
        export class Action {
            readonly name: string = this.constructor.name;
            async Handle() { }
        }

        export namespace Channel {
            export class Channel extends Action {
                readonly name = 'CHANNEL';
                async Handle() {
                    let a: ChatChannel = (await inquirer.prompt({
                        type: 'list', name: 'CHANNEL', message: "SELECT CHANNEL",
                        choices: [
                            new inquirer.Separator('OPENCHATS'),
                            ...KakaoBot.client.ChannelManager.getChannelIdList().filter(f => KakaoBot.client.ChannelManager.get(f).Type == ChannelType.OPENCHAT_GROUP).map(f => { let tp = KakaoBot.client.ChannelManager.get(f); return { name: tp.Name, value: tp }; }),
                            new inquirer.Separator('GROUP CHATS'),
                            ...KakaoBot.client.ChannelManager.getChannelIdList().filter(f => KakaoBot.client.ChannelManager.get(f).Type == ChannelType.GROUP).map(f => { let tp = KakaoBot.client.ChannelManager.get(f); return { name: tp.getUserInfoList().map(tq => tq.Nickname).join(', ').substr(0, 30), value: tp }; }),
                        ]
                    })).CHANNEL;
                    await HandleChannel(a);
                }
            }

            async function HandleChannel(channel: ChatChannel) {
                let action: ChannelAction = (await inquirer.prompt({
                    type: 'list', name: "ACTIONS", message: "ACTIONS",
                    choices: [
                        { name: 'CHAT', value: ChannelAction.CHAT },
                        { name: 'SETTINGS', value: ChannelAction.SETTING },
                        { name: 'LEAVE', value: ChannelAction.LEAVE },
                        { name: 'CANCEL', value: ChannelAction.CANCEL }
                    ]
                })).ACTIONS;
                switch (action) {
                    case ChannelAction.CHAT: {
                        //TODO: UPDATE BOTTOMBAR IF CHAT
                        LOOP:
                        while (true) { //WARNING: LOOP 'EVER' ROUTINE
                            let a: string = (await inquirer.prompt({ type: 'input', name: 'SEND', message: 'Send message' })).SEND
                            switch (getType(a)) {
                                case ChatCommand.NORMAL:
                                    channel.sendText(a);
                                    break;
                                case ChatCommand.NOTICE: {
                                    let c: string = (await inquirer.prompt({ type: 'input', name: 'SEND', message: 'Send NOTICE' })).SEND
                                    if (stdCancel.includes(c))
                                        return;
                                    let e = new CustomAttachment();
                                    e.readAttachment({
                                        P: {
                                            TP: CustomType.FEED, ME: `NOTICE`,
                                            SID: 'GKB', DID: 'GKB',
                                            SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                                            SL: {},
                                            VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                                        },
                                        C: {
                                            THC: 1,
                                            TI: {
                                                TD: {
                                                    T: `공지`,
                                                    D: c
                                                }
                                            },
                                            PR: {
                                                TD: { T: "Ch'en" },
                                                TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                                            }
                                        }
                                    });
                                    channel.sendTemplate(new AttachmentTemplate(e));
                                }
                                    break;
                                case ChatCommand.EXIT:
                                default:
                                    break LOOP;
                            }
                        }
                    }
                        break;
                    case ChannelAction.SETTING: {
                        let cs: ChannelSetting = (await inquirer.prompt({
                            type: 'list', name: "SETTING", message: "SETTING",
                            choices: [
                                { name: 'DISALLOW-COMMANDS', value: ChannelSetting.DISALLOW_COMMANDS },
                                { name: 'SYSTEM', value: ChannelSetting.SYSTEM_SETTING },
                                { name: 'CUSTOM', value: ChannelSetting.CUSTOM_SETTING },
                                { name: 'CANCEL', value: ChannelSetting.CANCEL }
                            ]
                        })).SETTING;
                        switch (cs) {
                            case ChannelSetting.DISALLOW_COMMANDS: {
                                let b: Array<string> = (await inquirer.prompt({
                                    type: 'checkbox', name: 'settings', message: 'SETTINGS', choices: [
                                        new inquirer.Separator('DISALLOW COMMANDS'),
                                        ...KakaoBot.commands.map(e => { return { name: e.constructor.name, value: e.constructor.name, checked: CustomSetting.getSettings(channel).disallowEvents.includes(e.constructor.name) } }),
                                        new inquirer.Separator('DISALLOW CHATEVENTS'),
                                        ...KakaoBot.chats.map(e => { return { name: e.constructor.name, value: e.constructor.name, checked: CustomSetting.getSettings(channel).disallowEvents.includes(e.constructor.name) } }),
                                        new inquirer.Separator('DISALLOW JOINEVENTS'),
                                        ...KakaoBot.joins.map(e => { return { name: e.constructor.name, value: e.constructor.name, checked: CustomSetting.getSettings(channel).disallowEvents.includes(e.constructor.name) } })
                                    ]
                                })).settings;
                                CustomSetting.getSettings(channel).disallowEvents = b;
                            }
                                break;
                            case ChannelSetting.CANCEL:
                                break;
                            default:
                                break;
                        }
                    }
                        break;
                    case ChannelAction.LEAVE: {
                        console.log('WARNING : YOU ARE LEAVING THIS ROOM');
                        let rt = Date.now().toString();
                        let cf: string = (await inquirer.prompt({ type: 'input', name: 'SEND', message: `INPUT ${rt}` })).SEND
                        if (rt == cf) {
                            let a = await channel.leave();
                            console.log(a ? 'SUCCESS LEAVE' : 'FAILURE');
                        }
                        else
                            console.log('INVAILD CONFIRM');
                    }
                        break;
                    default:
                        break;
                }
            }

            function getType(c: string) {
                if (stdLeave.includes(c))
                    return ChatCommand.EXIT
                else if ([`${stdPrefix}notice`, `${stdPrefix}n`].includes(c))
                    return ChatCommand.NOTICE;
                else
                    return ChatCommand.NORMAL
            }

            enum ChatCommand {
                NORMAL,
                NOTICE = 'notice',
                EXIT = 'exit'
            }
            enum ChannelAction {
                CHAT,
                SETTING,
                LEAVE,
                CANCEL
            }
            enum ChannelSetting {
                SYSTEM_SETTING,
                DISALLOW_COMMANDS,
                CUSTOM_SETTING,
                CANCEL
            }
        }

        export namespace Utils {
            export class Notice extends Action {
                readonly name = 'NOTICE';
                async Handle() {
                    let a: string = (await inquirer.prompt({ type: 'input', name: 'SEND', message: 'Send message' })).SEND
                    if (stdCancel.includes(a))
                        return;
                    let b: Array<ChatChannel> = (await inquirer.prompt({
                        type: 'checkbox', name: 'CHANNELS', message: 'SELECT CHANNELS', choices: [
                            new inquirer.Separator('OPENCHATS'),
                            ...KakaoBot.client.ChannelManager.getChannelIdList().filter(f => KakaoBot.client.ChannelManager.get(f).Type == ChannelType.OPENCHAT_GROUP).map(f => { let tp = KakaoBot.client.ChannelManager.get(f); return { name: tp.Name, value: tp }; }),
                            new inquirer.Separator('GROUP CHATS'),
                            ...KakaoBot.client.ChannelManager.getChannelIdList().filter(f => KakaoBot.client.ChannelManager.get(f).Type == ChannelType.GROUP).map(f => { let tp = KakaoBot.client.ChannelManager.get(f); return { name: tp.getUserInfoList().map(tq => tq.Nickname).join(', ').substr(0, 30), value: tp }; }),
                        ]
                    })).CHANNELS;
                    let e = new CustomAttachment();
                    e.readAttachment({
                        P: {
                            TP: CustomType.FEED, ME: `NOTICE`,
                            SID: 'GKB', DID: 'GKB',
                            SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                            SL: {},
                            VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                        },
                        C: {
                            THC: 1,
                            TI: {
                                TD: {
                                    T: `공지`,
                                    D: a
                                }
                            },
                            PR: {
                                TD: { T: "Ch'en" },
                                TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                            }
                        }
                    });
                    b.forEach(f => { try { f.sendTemplate(new AttachmentTemplate(e)) } catch (error) { LogError(`FAIL TO SEND NOTICE at ${f.Name} : ${error}`); } });
                }
            }
            export class Join extends Action {
                readonly name = 'JOIN OPEN CHAT';
                async Handle() {
                    let link: string = (await inquirer.prompt({ type: 'input', name: 'GOTO', message: 'JOIN CHAT' })).GOTO
                    let a = await KakaoBot.client.OpenLinkManager.getFromURL(link);
                    if (isNullOrUndefined(a) || a.LinkType == OpenLinkType.PROFILE) //profile, is ness'?
                        console.log('err:알 수 없는 링크');
                    else {
                        try {
                            let b = await KakaoBot.client.ChannelManager.joinOpenChannel(a.LinkId, { type: OpenProfileType.OPEN_PROFILE, profileLinkId: new Long(0, 0) }); //검열됨
                            if (b.status != StatusCode.SUCCESS)
                                KakaoBot.LogError(`입장실패, ${b.status}`);
                            else {
                                KakaoBot.LogInfo(`SUCCESS JOIN TO ${b.result.Name}`);
                            }
                        }
                        catch (e) {
                            KakaoBot.LogError(`err:${e}`);
                        }
                    }
                }
            }
            export class Cancel extends Action {
                readonly name = 'CANCEL';
            }
        }
    }
}
