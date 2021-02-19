import { Long, ChatUser, ChatChannel, OpenChatUserInfo, CustomImageCropStyle, ChatUserInfo } from "@storycraft/node-kakao";
import * as jsonfile from 'jsonfile';
import { isNullOrUndefined, isNull } from "util";

export namespace Shiritori {
    export const path = './res/shiritori'; //running 'app.ts[js]'

    export const cCho =
        ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
    export const cJung =
        ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
    export const cJong =
        ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
    export function sep(str) {
        var cnt = str.length
        if (str.match(/[ㄱ-ㅎ가-힣]/)) {
            var chars = []
            var cCode
            for (let i = 0; i < cnt; i++) {
                cCode = str.charCodeAt(i)
                if (cCode < 0xAC00 || cCode > 0xD7A3) {
                    chars.push(str.charAt(i))
                    continue
                }
                cCode = str.charCodeAt(i) - 0xAC00
                var jong = cCode % 28
                var jung = ((cCode - jong) / 28) % 21
                var cho = (((cCode - jong) / 28) - jung) / 21
                chars.push(cCho[cho], cJung[jung])
                cJong[jong] && chars.push(cJong[jong])
            }
            return chars
        }
        return str
    }
    export const db = {
        words: Object.keys(jsonfile.readFileSync(`${path}/worddb.json`)),
        jsons: char => Object.keys(jsonfile.readFileSync(`${path}/dbs/${char}.json`)),
        exists: word => Object.keys(jsonfile.readFileSync(`${path}/dbs/${sep(word)[0]}.json`)),
        startsWith: word => Object.keys(jsonfile.readFileSync(`${path}/dbs/${sep(word)[0]}.json`)),
        endsWith: word => db.words.filter(e => e.endsWith(word)),
        startends: (start, end) => db.words.filter(e => e.startsWith(start) && e.endsWith(end)),
        mean: word => jsonfile.readFileSync(`${path}/dbs/${sep(word)[0]}.json`)[word],
        isOnce: lastchars => db.jsons(lastchars[0]).some(e => sep(e[0]).join("") == lastchars),
        findOnce: word => db.startsWith(word).filter(e => !db.jsons(sep(e[e.length - 1])[0]).some(r => r[0] == e[e.length - 1])),
    }
    export function shuffle(arr) {
        var arr2 = arr.slice(0)
        for (var i = arr2.length; i; i--) {
            var j = Math.random() * i | 0
            var x = arr2[i - 1]
            arr2[i - 1] = arr2[j]
            arr2[j] = x
        }
        return arr2
    }
    export const ts = {
        "ㄹㄴ": ["ㅏ", "ㅓ", "ㅐ", "ㅔ", "ㅗ", "ㅚ", "ㅜ", "ㅡ"],
        "ㄹㅇ": ["ㅑ", "ㅕ", "ㅖ", "ㅛ", "ㅠ", "ㅣ"],
        "ㄴㅇ": ["ㅕ", "ㅛ", "ㅠ", "ㅣ"]
    };
    export function twoSounds(char) {
        return (
            (sep(char)[0] == "ㄴ" && ts["ㄴㅇ"].indexOf(sep(char)[1]) + 1) ||
            (sep(char)[0] == "ㄹ" && ts["ㄹㅇ"].indexOf(sep(char)[1]) + 1)) ?
                [sep(char).join(""), "ㅇ" + sep(char).join("").substr(1)] :
            ((sep(char)[0] == "ㄹ" && ts["ㄹㄴ"].indexOf(sep(char)[1]) + 1)
                ? [sep(char).join(""), "ㄴ" + sep(char).join("").substr(1)] :
                [sep(char).join("")]
            )
    }
    export function getLog(arr) {
        return "[ 게임 로그 ]\n" + arr.map((j, i) => (i + 1) + ". " + (j["sender"] ? j["sender"] + " : " + j["word"] : j)).join("\n");
    }
    export function winnerKl(inf: ChatUserInfo) {
        return {
            P: {
                TP: 'Feed', ME: `${inf.Nickname}님 승리`,
                SID: 'GKB', DID: 'GKB',
                SNM: `Ch'en By HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                SL: { },
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
                            THU: inf.FullProfileImageURL
                        }
                    }
                ],
                TI: {
                    TD: {
                        T: `${inf.Nickname}님 승리!`,
                        D: `축하합니다`
                    }
                },
                PR: {
                    TD: { T: "Ch'en" },
                    TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                }
            }
        }
    }
    export function nextKl(now: ChatUserInfo, next: ChatUserInfo, action: string, mean: string) {
        return {
            P: {
                TP: 'Feed', ME: `${now.Nickname}:${action}`,
                SID: 'GKB', DID: 'GKB',
                SNM: `다음:${next.Nickname}`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg'/*next.ProfileImageURL*/,
                SL: {},
                VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
            },
            C: {
                THC: 1,
                TI: {
                    TD: {
                        T: action,
                        D: mean
                    }
                },
                PR: {
                    TD: { T: "Ch'en" },
                    TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                }
            }
        }
    }

    export class Room {
        static readonly rooms: Map<Long, Room> = new Map();
        //TODO:Check async
        static nowpKl(room: ChatChannel) {
            let a = {
                P: {
                    TP: 'List', ME: '유저 목록', SID: 'GKB', DID: 'GKB', SNM: `Ch'en By HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                    SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                },
                C: {
                    THC: 1,
                    HD: { TD: { T: '유저 목록' } },
                    ITL: []
                }
            };

            Array.from(Room.rooms.get(room.Id).members.keys())
                .forEach(e => {
                        let c = room.getUserInfoId(e);
                        //let d = !isNullOrUndefined((b as OpenChatUserInfo).getOpenLink) ? (await (b as OpenChatUserInfo).getOpenLink()).LinkURL : null;
                        a.C.ITL.push({
                            TD: { T: c.Nickname, D: `` }, TH: { W: 200, H: 200, SC: 1, THU: c.FullProfileImageURL },
                            //L: isNull(c) ? undefined : { LPC: d, LMO: d }
                        });
                    });
            return a;
        }

        members: Map<Long, number> = new Map();
        shuffledMembers: Array<any> = []; //Long?
        start: boolean = false;
        turn: Long = null;
        round: number = 0;
        once: boolean = true; //한방단어
        ends: string = "";
        logs: Array<{ t: Logtype, d: any }> = [];

        join(user: ChatUser): boolean {
            if (this.members.has(user.Id))
                return false;
            this.members.set(user.Id, 3);
        }
        log(t: Logtype, d: any) {
            this.logs.push({t:t,d:d});
        }
    }

    export enum Logtype {
        ACTION,
        START,
        PLAYERLIST,
        LEAVE
    }
}