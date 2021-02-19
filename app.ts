import { KakaoBot } from "./src/KakaoBot";
import { Info, IdCapture } from "./src/Others/Management";
import { DollInfo } from "./src/GirlsFrontline/DollInfo";
import { DollTimetable, EquTimetable } from "./src/GirlsFrontline/TimeTable";
import { ForDeveloper, ForManager, ForUser } from "./src/Others/UtilityCommand";
import { ShiritoriCommand, ShiritoriCore } from "./src/Shiritori/Shiritori";
import { Aquamarine, AquamarineChat } from "./src/Economy/Economy";
import { Management } from "./src/Others/ManageUser";
import { Akagi } from "./src/School/AutoAttendance";
import { scheduleJob } from "node-schedule";
import { CustomSetting } from "./src/Setting";
import { Coral } from "./src/Economy/Coral";

KakaoBot.Taihou.addAction(new KakaoBot.Taihou.Utils.Notice());
KakaoBot.Taihou.addAction(new KakaoBot.Taihou.Channel.Channel());
KakaoBot.Taihou.addAction(new KakaoBot.Taihou.Utils.Join());
KakaoBot.Taihou.addAction(new KakaoBot.Taihou.Utils.Cancel());

KakaoBot.addCommandEvent(new KakaoBot.SystemCommand.Help());

KakaoBot.addCommandEvent(new Coral.Shop.CoralShopCommand());
KakaoBot.addCommandEvent(new Coral.Commands.CoralCommandCore());
KakaoBot.addCommandEvent(new Coral.Commands.CoralCommandAttack());
KakaoBot.addCommandEvent(new Coral.Commands.CoralItemEquip());
KakaoBot.addCommandEvent(new Coral.Commands.CoralItemUse());
KakaoBot.addCommandEvent(new Coral.Commands.CoralLoadMag());
KakaoBot.addCommandEvent(new Coral.Commands.CoralGiveup());

KakaoBot.addCommandEvent(new AquamarineChat.Attendance());
KakaoBot.addChatEvent(new AquamarineChat.ChatExp());
KakaoBot.addCommandEvent(new AquamarineChat.Profile());
KakaoBot.addCommandEvent(new AquamarineChat.Stock());
KakaoBot.addCommandEvent(new AquamarineChat.Transfer());
KakaoBot.addCommandEvent(new AquamarineChat.Management());

KakaoBot.addCommandEvent(new ShiritoriCommand.ShiritoriCommand());
KakaoBot.addCommandEvent(new ShiritoriCommand.ShiritoriAction());

KakaoBot.addChatEvent(new Management.Events.Alart());
KakaoBot.addCommandEvent(new Management.Events.Report());
KakaoBot.addCommandEvent(new Management.Events.Process());
KakaoBot.addCommandEvent(new Management.Events.Hides());

KakaoBot.addCommandEvent(new DollInfo());
KakaoBot.addCommandEvent(new IdCapture());
KakaoBot.addCommandEvent(new Info());
KakaoBot.addCommandEvent(new ForDeveloper.Simulate());
KakaoBot.addCommandEvent(new ForManager.Kick());
KakaoBot.addCommandEvent(new ForUser.CallManager());
KakaoBot.addCommandEvent(new ForUser.HeartReactor());
KakaoBot.addCommandEvent(new ForUser.RandomUser());
KakaoBot.addCommandEvent(new DollTimetable());
KakaoBot.addCommandEvent(new EquTimetable());

KakaoBot.addCommandEvent(new Akagi.AkagiCommand());

KakaoBot.login();

KakaoBot.client.on('login', async () => {
    try {
        KakaoBot.LogInfo('load shop');
        Coral.Shop.Load();
        KakaoBot.LogInfo('load shiritori');
        await ShiritoriCore.Database.Load();
        KakaoBot.LogInfo('load accounts');
        await Aquamarine.LoadData();
        KakaoBot.LogInfo('load students');
        await Akagi.LoadData();
        KakaoBot.LogInfo('load settings');
        await CustomSetting.LoadData();
        KakaoBot.LogInfo('load complate');
        KakaoBot.LogInfo(`success login at ${KakaoBot.client.Name}`);
    }
    catch (e) { KakaoBot.LogError(e); }
});


['SIGINT', 'SIGHUP', 'SIGBREAK', 'SIGBUS']
    .forEach((eventType) => {
        process.on(eventType, () => { SAVE(); console.log(eventType); process.exit(0); });
    });
process.on('uncaughtException', error => { SAVE(); KakaoBot.LogError(error); KakaoBot.LogError(error.stack); process.exit(0); });
process.on('unhandledRejection', reason => { SAVE(); KakaoBot.LogError(reason); });
scheduleJob('autosave', '*/30 * * * *', () => { SAVE(); });

function SAVE() {
    try {
        KakaoBot.LogInfo('save accounts');
        Aquamarine.SaveData();
        //KakaoBot.LogInfo('save students');
        //Akagi.SaveData();
        KakaoBot.LogInfo('save settings');
        CustomSetting.SaveData();
        KakaoBot.LogInfo('save complate');
    }
    catch (e) { KakaoBot.LogError(e); }
}
