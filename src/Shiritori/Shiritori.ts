import { CommandEvent, ChatEvent } from "../Event";
import { Chat, ChannelType, OpenChatChannel, ChatChannel, ChatUser, Long, CustomImageCropStyle, CustomAttachment, AttachmentTemplate, ChatMention } from "@storycraft/node-kakao";
import { isNull } from "util";
import * as jsonfile from 'jsonfile';
import { KakaoBot } from "../KakaoBot";
import { Aquamarine } from "../Economy/Economy";

export namespace ShiritoriCommand {
    export class ShiritoriCommand extends CommandEvent {
        readonly command = '끝말잇기';
        readonly aliases = ['시토', '끄투'];
        readonly description = '끝말잇기';

        HandlePrefix(chat: Chat) {
            chat.replyText(new ChatMention(chat.Channel.getUserInfo(chat.Sender)), `${'\u200b'.repeat(500)}
현재 이 방의 끝말잇기 방 생성여부: ${ShiritoriCore.games.has(chat.Channel) ? '생성됨' : '생성되지 않음'}

${KakaoBot.prefix}${this.command} 생성 - 방을 생성합니다
${KakaoBot.prefix}${this.command} 참여 - 방에 참여합니다
${KakaoBot.prefix}${this.command} 시작 - 게임을 시작합니다(호스트 전용)
${KakaoBot.prefix}${this.command} 나가기 - 방을 나가거나 기권합니다
${KakaoBot.prefix}${this.command} 금지 - 끝말잇기를 금지하거나 허용합니다(관리자 전용 명령어)`);
        }
        
        HandleArgs(chat: Chat, args: Array<string>) {
            //TODO:REF
            switch (args[0]) {
                case '생성':
                    if (ShiritoriCore.games.has(chat.Channel))
                        chat.replyText('생성실패:이미 생성되어 있습니다');
                    else if (!ShiritoriCore.CreateGame(chat.Channel, chat.Sender))
                        chat.replyText('생성실패:이 방에서 끝말잇기가 금지되어 있습니다');
                    else {
                        chat.replyText('생성완료');
                    }
                    break;
                case '참여':
                case '참가':
                case '입장':
                    if (!ShiritoriCore.games.has(chat.Channel))
                        chat.replyText('방을 생성해주세요');
                    else if (ShiritoriCore.games.get(chat.Channel).players.has(chat.Sender.Id))
                        chat.replyText('이미 참여중입니다');
                    else if (ShiritoriCore.games.get(chat.Channel).started)
                        chat.replyText('게임이 이미 시작되어 참여할 수 없습니다');
                    else {
                        ShiritoriCore.games.get(chat.Channel).AddPlayer(chat.Sender.Id);
                        chat.replyText('입장완료');
                    }
                    break;
                case '시작':
                    if (!ShiritoriCore.games.has(chat.Channel))
                        chat.replyText('방을 생성해주세요');
                    else if (!Array.from(ShiritoriCore.games.get(chat.Channel).players.keys())[0].equals(chat.Sender.Id))
                        chat.replyText('호스트만 사용이 가능합니다');
                    else if (ShiritoriCore.games.get(chat.Channel).players.size < 2)
                        chat.replyText('2명 이상이 참가해야 됩니다');
                    else if (ShiritoriCore.games.get(chat.Channel).started)
                        chat.replyText('게임이 이미 시작되었습니다');
                    else {
                        ShiritoriCore.games.get(chat.Channel).Start();
                        chat.replyText(`${chat.Channel.getUserInfoId(ShiritoriCore.games.get(chat.Channel).now).Nickname}님 입력해주세요(예시: ':단어')`);
                    }
                    break;
                case '나가기':
                case '기권':
                    if (!ShiritoriCore.games.has(chat.Channel))
                        chat.replyText('방을 생성해주세요');
                    else if (!ShiritoriCore.games.get(chat.Channel).players.has(chat.Sender.Id))
                        chat.replyText('참여하지 않은 유저입니다');
                    else {
                        if (ShiritoriCore.games.get(chat.Channel).started) {
                            if (chat.Sender.Id.equals(ShiritoriCore.games.get(chat.Channel).now))
                                chat.replyText(`${chat.Channel.getUserInfoId(chat.Sender.Id).Nickname}님 탈락, ${chat.Channel.getUserInfoId(ShiritoriCore.games.get(chat.Channel).shuffledPlayer[0]).Nickname}님 입력해주세요`);
                            else
                                chat.replyText(`${chat.Channel.getUserInfoId(chat.Sender.Id).Nickname}님 탈락`);
                        }
                        else {
                            chat.replyText('방을 나갔습니다.');
                        }
                        ShiritoriCore.games.get(chat.Channel).PlayerGiveUp(chat.Sender.Id);
                    }
                    break;
                case '금지':
                    if (chat.Channel.Type == ChannelType.OPENCHAT_GROUP && (chat.Channel as OpenChatChannel).canManageChannel(chat.Sender))
                        chat.replyText('권한이 없습니다!');
                    else
                        chat.replyText((ShiritoriCore.ToggleAllow(chat.Channel) ? '끝말잇기가 금지되었습니다' : '끝말잇기가 허용되었습니다'));
                    break;
                case 'AI':
                    chat.replyText('다음 버전에 추가될 예정입니다');
                    break;
                case '도움말':
                default:
                    this.HandlePrefix(chat);
                    break;
            }
        }
    }

    export class ShiritoriAction extends CommandEvent {
        readonly command = `\u200b:`;
        readonly description = '끝말잇기 입력용 커맨드';

        Handle(chat: Chat) {
            if (!ShiritoriCore.games.has(chat.Channel) || !ShiritoriCore.games.get(chat.Channel).started || !ShiritoriCore.games.get(chat.Channel).now.equals(chat.Sender.Id))
                return;

            let e = ShiritoriCore.games.get(chat.Channel).Action(chat.Text.replace(this.command.replace('\u200b', ''), ''));
            switch (e) {
                case ShiritoriCore.ActionStatus.VAILD:
                    let a = {
                        P: {
                            TP: 'Feed', ME: `${chat.Channel.getUserInfo(chat.Sender).Nickname}:${chat.Text.replace(this.command.replace('\u200b', ''), '')}`,
                            SID: 'GKB', DID: 'GKB',
                            SNM: `다음:${chat.Channel.getUserInfoId(ShiritoriCore.games.get(chat.Channel).now).Nickname}`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                            SL: {},
                            VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                        },
                        C: {
                            THC: 1,
                            TI: {
                                TD: {
                                    T: chat.Text.replace(this.command.replace('\u200b', ''), ''),
                                    D: ShiritoriCore.Database.getAllWordMean(chat.Text.replace(this.command.replace('\u200b', ''), ''))
                                }
                            },
                            PR: {
                                TD: { T: "Ch'en" },
                                TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                            }
                        }
                    }
                    let b = new CustomAttachment()
                    b.readAttachment(a);
                    chat.replyTemplate(new AttachmentTemplate(b));
                    break;
                case ShiritoriCore.ActionStatus.INVAILD_START:
                    chat.replyText(`${ShiritoriCore.games.get(chat.Channel).end}로 시작하는 단어를 입력하세요`)
                    break;
                case ShiritoriCore.ActionStatus.ONECOM_BENNED:
                    chat.replyText('한방단어가 금지되어있습니다');
                    break;
                case ShiritoriCore.ActionStatus.ALREADY_USED:
                    chat.replyText('이미 사용한 단어입니다');
                    break;
                case ShiritoriCore.ActionStatus.TOOSHORT:
                case ShiritoriCore.ActionStatus.UNKNOWN_WORD:
                default:
                    chat.replyText('올바른 단어를 입력하세요');
                    break;
            }
        }
    }
}

export namespace ShiritoriCore {
    export const defLife = 1;
    export const defTime = 15;

    export const games: Map<ChatChannel, Game> = new Map();
    export const disallow: Array<ChatChannel> = [];

    export function CreateGame(room: ChatChannel, host: ChatUser): boolean {
        if (disallow.includes(room))
            return false;
        var a = new Game(room);
        a.AddPlayer(host.Id);
        games.set(room, a);
        return true;
    }

    export function ToggleAllow(room: ChatChannel): boolean {
        if (disallow.includes(room))
            disallow.splice(disallow.indexOf(room), 1);
        else
            disallow.push(room);
        return disallow.includes(room);
    }

    export class Game {
        constructor(room: ChatChannel) { this.room = room; }

        //KAKAO FIELD
        room: ChatChannel;
        players: Map<Long, number> = new Map();

        //SETTING FIELD
        useAI: boolean = false;
        AI: AILevel = AILevel.Easy;
        allowOneCom: boolean = false;

        //DATA FIELD
        started: boolean = false;
        playtime: number = 0;
        gamePause: boolean = false;
        round: number = 0;

        AILife: number = 0;
        get isAIAlive() { return this.useAI && this.AILife > 0; }

        time: number = null;
        TimeReset() { this.time = defTime; }

        usedWord: Array<string> = [];
        end: string = '';

        shuffledPlayer: Array<Long> = []; //null = AI
        now: Long;

        loop: NodeJS.Timeout;

        //CORE FUNCTIONS
        Start() {
            if (this.started)
                return;
            this.shuffledPlayer = shuffle(Array.from(this.players.keys()));
            this.Next();
            this.started = true;
            this.loop = setInterval(
                (game: Game) => { game.Loop(); },
                1000,
                this
            );
        }
        Off() {
            this.started = false;
            clearInterval(this.loop);
            games.delete(this.room);
        }

        //CALLBACK ONLY
        //RUNNING EVERY SECOND
        async Loop() {
            try {
                if (this.gamePause)
                    return;
                //TODO:IF ROOM OR PLAYER IS INVAILD, this.Off()
                this.playtime++;
                this.time--;
                if (this.time == 10)
                    this.room.sendText('10초 남았습니다.');
                else if (this.time < 1) {
                    this.TimeReset();
                    switch (this.Damage()) {
                        case DamageStatus.Player_Damaged:
                            this.room.sendText(`${(await this.room.getLatestUserInfoId(this.now)).Nickname}님의 라이프 1 감소`);
                            break;
                        case DamageStatus.Player_Dead:
                            this.room.sendText(`${(await this.room.getLatestUserInfoId(this.now)).Nickname}님 탈락!`);
                            this.PlayerGiveUp(this.now);
                            break;
                    }
                    if (this.started) {
                        this.NextRound();
                        this.room.sendText(`초기화 완료, ${(await this.room.getLatestUserInfoId(this.now)).Nickname}님 입력해주세요`);
                    }
                }
            }
            catch {
                this.room.sendText('오류 발생, 게임을 강제 종료합니다');
                this.Off();
            }
        }

        //GAME FUNCTIONS
        AddPlayer(p: Long): boolean {
            if (this.players.has(p))
                return false;
            this.players.set(p, defLife);
            return true;
        }

        PlayerGiveUp(p: Long) {
            if (!this.players.has(p))
                return;
            this.players.delete(p);
            if (this.started) {
                this.shuffledPlayer.splice(this.shuffledPlayer.indexOf(p));
                if (this.now.equals(p))
                    this.Next();
            }

            //ISSUE KAKAO
            if (this.players.size < 2) {
                if (this.started) {
                    let a = new CustomAttachment();
                    a.readAttachment({
                        P: {
                            TP: 'Feed', ME: `${this.room.getUserInfoId(this.shuffledPlayer[0]).Nickname}님 승리`,
                            SID: 'GKB', DID: 'GKB',
                            SNM: `Ch'en By HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                            SL: {},
                            VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                        },
                        C: {
                            THC: 3,
                            THL: [
                                {
                                    TH: {
                                        W: 1000,
                                        H: 1000,
                                        SC: CustomImageCropStyle.ORIGINAL,
                                        THU: this.room.getUserInfoId(this.shuffledPlayer[0]).FullProfileImageURL
                                    }
                                }
                            ],
                            TI: {
                                TD: {
                                    T: `${this.room.getUserInfoId(this.shuffledPlayer[0]).Nickname}님 승리!`,
                                    D: `축하합니다`
                                }
                            },
                            PR: {
                                TD: { T: "Ch'en" },
                                TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                            }
                        }
                    });
                    this.room.sendTemplate(new AttachmentTemplate(a));
                    Aquamarine.getUser(this.shuffledPlayer[0], this.room).issueExp(300, this.room);
                    Aquamarine.getUser(this.shuffledPlayer[0], this.room).balance += 150000;
                }
                else {
                    this.room.sendText('방이 삭제됩니다');
                }
                this.Off();
            }
        }

        UseAI(lev: AILevel) {
            this.useAI = true;
            this.AI = lev;
            this.AILife = defLife;
        }

        NextRound() {
            this.round++;
            this.usedWord = [];
            this.end = '';
        }

        //TODO:MUST FIX THIS
        //may be used in 'loop' only
        //TO USE:MUST CHECK 'now' IS AI
        Damage(): DamageStatus {
            if (!isNull(this.now)) {
                this.players.set(this.now, this.players.get(this.now) - 1); //TODO
                if (this.players.get(this.now) < 1)
                    return DamageStatus.Player_Dead;
                else
                    return DamageStatus.Player_Damaged;
            }
            else {
                this.AILife--;
                if (!this.isAIAlive) {
                    //TODO:DEAD
                    this.Next();
                    return DamageStatus.AI_Dead;
                }
                return DamageStatus.Player_Damaged;
            }
        }

        Next() {
            this.TimeReset();
            this.now = this.shuffledPlayer.shift();
            this.shuffledPlayer.push(this.now);
            //TODO:Handle if next is AI
            //AI:immediate Action(str);
            //AI:Issue to KAKAO
        }

        Action(str: string): ActionStatus {
            if (this.usedWord.includes(str))
                return ActionStatus.ALREADY_USED;
            else if (str.length < 2)
                return ActionStatus.TOOSHORT;
            else if (this.usedWord.includes(str))
                return ActionStatus.ALREADY_USED;
            else if (!this.allowOneCom && Database.isOwnComWord(str))
                return ActionStatus.ONECOM_BENNED;
            else if (this.end != '' && (this.end != Database.getFirstChar(str) && Database.getNextChar(this.end) != Database.getFirstChar(str)))
                return ActionStatus.INVAILD_START
            else if (!Database.isWord(str))
                return ActionStatus.UNKNOWN_WORD
            else {
                this.usedWord.push(str);
                this.end = Database.getLastChar(str);
                this.Next();
                return ActionStatus.VAILD;
            }
        }

        //KAKAO FUNCTION
        //TODO

        //AI FUNCTION
    }

    export enum AILevel {
        Easy,
        Nomal,
        Hard
    }

    export enum ActionStatus {
        VAILD,
        TOOSHORT,
        ALREADY_USED,
        UNKNOWN_WORD,
        ONECOM_BENNED,
        INVAILD_START
    }

    export enum DamageStatus {
        Player_Damaged,
        Player_Dead,
        AI_Damaged,
        AI_Dead
    }

    function shuffle(arr: Array<any>) {
        var arr2 = arr.slice(0)
        for (var i = arr2.length; i; i--) {
            var j = Math.random() * i | 0
            var x = arr2[i - 1]
            arr2[i - 1] = arr2[j]
            arr2[j] = x
        }
        return arr2;
    }

    export namespace Database {
        const resPath = './res/shiritori'; //RUN AT app.ts
        const wordlistPath = `${resPath}/AllWordList.wcf`;
        const startwordlistPath = `${resPath}/StartWordList.wcf`;

        export var words = [];
        export var startwords = [];

        //TODO:MUST RUN BEFORE CONNECTION
        export function Load() {
            words = jsonfile.readFileSync(wordlistPath);
            startwords = jsonfile.readFileSync(startwordlistPath);
        }

        export function getNextChar(lastChar) {
            let data = lastChar.charCodeAt() - 0xAC00;
            if (data < 0 || data > 11171) return;

            const RIEUL_TO_NIEUN = [4449, 4450, 4457, 4460, 4462, 4467];
            const RIEUL_TO_IEUNG = [4451, 4455, 4456, 4461, 4466, 4469];
            const NIEUN_TO_IEUNG = [4455, 4461, 4466, 4469];

            let onset = Math.floor(data / 28 / 21) + 0x1100,
                nucleus = (Math.floor(data / 28) % 21) + 0x1161,
                coda = (data % 28) + 0x11A7, isNextChar = false, NextChar;

            if (onset == 4357) {
                isNextChar = true;
                (RIEUL_TO_NIEUN.indexOf(nucleus) != -1) ? onset = 4354 : (RIEUL_TO_IEUNG.indexOf(nucleus) != -1) ? onset = 4363 : NextChar = false;
            }
            else if (onset == 4354) {
                if (NIEUN_TO_IEUNG.indexOf(nucleus) != -1) {
                    onset = 4363;
                    isNextChar = true;
                }
            }
            if (isNextChar) {
                onset -= 0x1100; nucleus -= 0x1161; coda -= 0x11A7;
                NextChar = String.fromCharCode(((onset * 21) + nucleus) * 28 + coda + 0xAC00);
            }

            return NextChar;
        }

        export function getRandomWord() {
            return Object.keys(words)[Math.floor(Math.random() * Object.keys(words).length)];
        }

        export function getStartWord(startChar) {
            return startwords[startChar];
        }

        export function getFirstChar(word) {
            return word[0];
        }

        export function getLastChar(word) {
            return word[word.length - 1];
        }

        export function getLastCharMessage(lastChar) {
            return lastChar = (getNextChar(lastChar)) ? `${lastChar(getNextChar(lastChar))}` : lastChar;
        }

        export function isWord(word) {
            return words[word] ? true : false;
        }

        export function isStartChar(startChar) {
            return startwords[startChar] ? true : false;
        }

        export function isOwnComWord(word) {
            if (isStartChar(getLastChar(word))) return false;
            else return (isStartChar(getNextChar(getLastChar(word)))) ? false : true;
        }

        export function getAllWordMean(word) {
            if (isWord(word)) {
                let allWord = words[word], len = allWord.length, i, text = [];

                for (i = 0; i < len; i++) {
                    text[i] = "「" + (i+1) + "」「명사」 " + allWord[i];
                }

                return text.join("|");
            }
            else return null;
        }
    }
}
