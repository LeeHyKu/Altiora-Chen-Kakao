import { Long, Chat, ChannelType } from "@storycraft/node-kakao";
import fetch from "node-fetch";
import { CommandEvent } from "../Event";
import { isNullOrUndefined } from "util";
import * as jsonfile from 'jsonfile';

export namespace Akagi {
    const Host = 'https://eduro.sen.go.kr/';
    const Alfa = 'stv_cvd_co00_012.do';
    const Bravo = 'stv_cvd_co01_000.do';
    const Confirm = 'stv_cvd_co02_000.do';
    const savepath = './dat/akagi';

    export var students: Array<StudentInfo> = [];

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
            jsonfile.readFileSync(`${savepath}/saves.json`)
                .forEach(async e => {
                    students.push(StudentInfo.FromJson(e));
                });
        }
        catch { }
    }
    export function SaveData() {
        /*
        save guide

        1.save data to default file
        2.save data to 'data_year_month_day_daysecond.json'
        */
        var a = students.map(e => e.toJson);
        jsonfile.writeFileSync(`${savepath}/saves.json`, a, { spaces: 2, EOL: '\r\n' });

        let d = new Date();
        jsonfile.writeFileSync(`${savepath}/archive/${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}D${d.getHours()}.${d.getMinutes()}.${d.getSeconds()}T${d.getMilliseconds()}Z.json`, a, { spaces: 2, EOL: '\r\n' });
    }

    export class StudentInfo{
        user: Long;

        name: string;
        birth: string;

        constructor(user, name, birth) {
            this.user = user;
            this.name = name;
            this.birth = birth;
        }

        async Auto(): Promise<AutoResult> {
            let a = await (await fetch(
                `${Host}${Alfa}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `qstnCrtfcNoEncpt=&rtnRsltCode=&schulCode=B100000642&schulNm=학교이름&pName=${this.name}&frnoRidno=${this.birth}&aditCrtfcNo=`
                })).json(); //encodeURI
            //console.log(a);
            if (a['resultSVO']['data']['rtnRsltCode'] != 'SUCCESS')
                return { status: AutoStatus.INVAILD_INFO, result: a };
            //console.log(a['resultSVO']['data']['qstnCrtfcNoEncpt']);
            let b = await (await fetch(
                `${Host}${Bravo}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `rtnRsltCode=SUCCESS&qstnCrtfcNoEncpt=${encodeURIComponent(a['resultSVO']['data']['qstnCrtfcNoEncpt'])}&schulCode=&schulNm=&rspns01=1&rspns02=1&rspns07=0&rspns08=0&rspns09=0`
                })).json();
            //console.log(b);
            if (b['resultSVO']['data']['rtnRsltCode'] != 'SUCCESS')
                return { status: AutoStatus.FAIL, result: b };
            else {
                return { status: AutoStatus.SUCCESS, result: b };
            }
        }

        static FromJson(j: any) {
            return new StudentInfo(Long.fromString(j['user']), j['name'], j['birth']);
        }
        get toJson() {
            return {
                user: this.user.toString(),
                name: this.name,
                birth: this.birth
            }
        }
    }

    export interface AutoResult {
        status: AutoStatus;
        result: any
    }

    export enum AutoStatus {
        SUCCESS,
        FAIL,
        INVAILD_INFO,
        UNKNOWN
    }

    /*COMMAND FIELD*/
    export class AkagiCommand extends CommandEvent {
        readonly command = '자가진단';
        readonly aliases = ['자가'];
        readonly description = '개인용, 범용은 개발중입니다';

        async HandlePrefixAsync(chat: Chat) {
            if (chat.Channel.Type != ChannelType.GROUP)
                chat.replyText('개인용 커맨드입니다. 모두가 사용할 수 있는 범용 기능은 개발중 입니다.');
            else if (isNullOrUndefined(students.find(e => e.user.equals(chat.Sender.Id))))
                chat.replyText('등록되지 않았습니다');
            else {
                try {
                    let a = await students.find(e => e.user.equals(chat.Sender.Id)).Auto();
                    switch (a.status) {
                        case AutoStatus.SUCCESS:
                            chat.replyText(`자동 출석 성공`);
                            break;
                        default:
                            chat.replyText(`자동 출석 실패: ${a.result['resultSVO']['data']['rtnRsltCode']}`);
                            break;
                    }
                }
                catch (e) {
                    chat.replyText(`에러가 발생했습니다.${'\u200b'.repeat(500)}
message: ${e.message}
at ${e.fileName}(${e.lineNumber})`);
                }
            }
        }
        HandleArgs(chat: Chat, args: Array<string>) {
            switch (args[0]) {
                case '등록':
                    if (chat.Channel.Type != ChannelType.GROUP)
                        chat.replyText('개인용 커맨드입니다. 모두가 사용할 수 있는 범용 기능은 개발중 입니다.');
                    else if (!isNullOrUndefined(students.find(e => e.user.equals(chat.Sender.Id))))
                        chat.replyText('이미 등록되어 있습니다');
                    else if (args.length < 3)
                        chat.replyText('올바른 정보를 입력해주세요');
                    else {
                        students.push(new StudentInfo(chat.Sender.Id, args[1], args[2]));
                        chat.replyText(`등록되었습니다
이름:${args[1]}
생년월일:${args[2]}`);
                    }
                    break;
                case '수정':
                    if (chat.Channel.Type != ChannelType.GROUP)
                        chat.replyText('개인용 커맨드입니다. 모두가 사용할 수 있는 범용 기능은 개발중 입니다.');
                    else if (isNullOrUndefined(students.find(e => e.user.equals(chat.Sender.Id))))
                        chat.replyText('등록되지 않았습니다');
                    else if (args.length < 3)
                        chat.replyText('올바른 정보를 입력해주세요');
                    else {
                        students.find(e => e.user.equals(chat.Sender.Id)).name = args[1];
                        students.find(e => e.user.equals(chat.Sender.Id)).birth = args[2];
                        chat.replyText(`등록되었습니다
이름:${args[1]}
생년월일:${args[2]}`);
                    }
                    break;
                default:
                    this.HandlePrefixAsync(chat);
                    break;
            }
        }
    }
}
