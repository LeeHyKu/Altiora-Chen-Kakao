import { Long } from "bson";
import { ChatChannel, Chat, ChatMention, CustomAttachment, CustomType, AttachmentTemplate, CustomImageCropStyle } from "@storycraft/node-kakao";
import { CommandEvent } from "../Event";
import { Aquamarine } from "./Economy";
import { isNullOrUndefined } from "util";
import { KakaoBot } from "../KakaoBot";
import * as jsonfile from "jsonfile";

export namespace Coral {
    export const battles: Array<Battle> = [];
    export function getCurrentBattle(id: Long) {
        return battles.find(e => !e.endGame && (e.host.id.equals(id) || e.invited.id.equals(id)));
    }
    export function addBattle(h: Long, i: Long, c: ChatChannel) {
        if (!isNullOrUndefined(getCurrentBattle(h)) || !isNullOrUndefined(getCurrentBattle(i)))
            return false;
        else {
            battles.push(new Battle(h, i, c));
            return true;
        }
    }

    export class Battle {
        host: UserStatusBattle;
        invited: UserStatusBattle;

        channel: ChatChannel;

        endGame: boolean = false;

        loop: NodeJS.Timeout;
        autoend: NodeJS.Timeout;

        constructor(h: Long, i: Long, c: ChatChannel) {
            let HS = Aquamarine.getUser(h, c).status.UpdateCache;
            this.host = {
                id: h, HP: +HS.MaxHP.toFixed(4), AP: +HS.MaxAP.toFixed(4), cache: HS, ATKPLUS: 0
            };
            let IS = Aquamarine.getUser(i, c).status.UpdateCache;
            this.invited = {
                id: i, HP: +IS.MaxHP.toFixed(4), AP: +IS.MaxAP.toFixed(4), cache: IS, ATKPLUS: 0
            };
            this.channel = c;
            this.loop = setInterval(() => { this.LOOP(); }, 1000);
            this.autoend = setTimeout(() => { this.endGame = true; }, 1800000); //AUTO END
        }

        /* CALLBACK ONLY */
        LOOP() {
            try {
                if (!isNullOrUndefined(this.loop) && this.endGame) {
                    clearTimeout(this.autoend);
                    clearInterval(this.loop);
                }
                else {
                    //TODO: END GAME IF USER IS INVAILD
                    if (this.host.AP < this.host.cache.MaxAP)
                        this.host.AP += Math.min(0.5, this.host.cache.MaxAP - this.host.AP);
                    if (this.invited.AP < this.invited.cache.MaxAP)
                        this.invited.AP += Math.min(0.5, this.invited.cache.MaxAP - this.invited.AP);
                }
            }
            catch (error) {
                //END GAME
            }
        }

        isAttacker(id: Long) { return this.host.id.equals(id); }
        getRealTimeInfo(isAttacker: boolean): Aquamarine.User { let a = isAttacker ? this['host'] : this['invited']; return Aquamarine.getUser(a.id, this.channel); }
        getRealTimeStatus(isAttacker: boolean): UserStatus { let a = isAttacker ? this['host'] : this['invited']; return Aquamarine.getUser(a.id, this.channel).status; }
        getStatus(isattacker: boolean): UserStatusBattle { return isattacker ? this['host'] : this['invited']; }
        attack(isattacker: boolean): BattleAttackResult {
            this.updateCache(isattacker);
            this.updateCache(!isattacker);
            let attacker = isattacker ? 'host' : 'invited';
            let victim = isattacker ? 'invited' : 'host';
            let useAP = +Math.max(1 + this[attacker].cache.FAT, 0.1).toFixed(2);
            if (this[attacker].AP < useAP)
                return { attacked: false };
            let damage = +Math.max(((this[attacker].cache.ATK + this[attacker].ATKPLUS) - Math.max((this[victim].cache.DEF - this[attacker].cache.PAN), 0)) + Math.floor(Math.random() * this[attacker].cache.ATK / 10), 1).toFixed(4);
            this[victim].HP -= damage;
            this[attacker].AP -= useAP;
            this.getRealTimeStatus(isattacker).issueWEAPONUse();
            this.getRealTimeStatus(!isattacker).issueArmorDamage();
            if (this[victim].HP < 1)
                this.setWinner(isattacker);
            return {
                attacked: true,
                dead: this[victim].HP < 1,
                damage: damage,
                hpnow: this[victim].HP,
                apnow: this[attacker].AP
            }
        }
        updateCache(isattacker: boolean) {
            let a = isattacker ? 'host' : 'invited';
            this[a].cache = this.getRealTimeStatus(isattacker).UpdateCache;
        }
        useItem(isattacker: boolean, item: Item.DisposableTemplate) {
            let a = isattacker ? 'host' : 'invited';
            switch (item.type) {
                case Item.ItemType.HEAL:
                    this[a].HP += Math.min((<Item.HEALTemplate>item).heal, this[a].cache.MaxHP - this[a].HP);
                    break;
                case Item.ItemType.ATK_DRUG:
                    this[a].ATKPLUS += (<Item.ATKTemplate>item).atk;
                    break;
                case Item.ItemType.TACCUSTOM:
                    new Function("status", "battle", (item as Item.TacticalCustomTemplate).action)(this.getRealTimeStatus(isattacker), this);
                    break;
            }
        }

        setWinner(isattacker: boolean) {
            this.endGame = true;
            let attacker = isattacker ? 'host' : 'invited';
            let victim = isattacker ? 'invited' : 'host';

            let atkinfo = this.getRealTimeInfo(isattacker);
            let vicinfo = this.getRealTimeInfo(!isattacker);

            Aquamarine.getUser(this[attacker].id, this.channel).issueExp(300, this.channel);
            Aquamarine.getUser(this[attacker].id, this.channel).balance += 150000 + (Math.max(vicinfo.level.level - atkinfo.level.level, 0) * 10000);
            Aquamarine.getUser(this[attacker].id, this.channel).status.Kill();
            Aquamarine.getUser(this[victim].id, this.channel).status.Death();
            let a = new CustomAttachment();
            a.readAttachment({
                P: {
                    TP: 'Feed', ME: `${this.channel.getUserInfoId(this[attacker].id).Nickname}님 승리`,
                    SID: 'GKB', DID: 'GKB', SNM: `Ch'en By HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                    SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                },
                C: {
                    THC: 3,
                    THL: [{ TH: { W: 1000, H: 1000, SC: CustomImageCropStyle.ORIGINAL, THU: this.channel.getUserInfoId(this[attacker].id).FullProfileImageURL } }],
                    TI: { TD: { T: `${this.channel.getUserInfoId(this[attacker].id).Nickname}님 승리!`, D: `축하합니다` } },
                    PR: { TD: { T: "Ch'en" }, TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL } }
                }
            });
            this.channel.sendTemplate(new AttachmentTemplate(a));
        }
    }

    export interface UserStatusBattle {
        id: Long;
        cache: CacheStatus;
        HP: number;
        AP: number;
        ATKPLUS: number;
    }
    export interface CacheStatus {
        MaxHP: number;
        MaxAP: number;

        ATK: number;
        DEF: number;
        PAN: number;
        FAT: number;
    }

    export interface BattleAttackResult {
        attacked: boolean,
        dead?: boolean,
        damage?: number,
        hpnow?: number,
        apnow?: number
    }

    export class UserStatus {
    /* HISTORY AREA */
        KILL: number = 0;
        DEATH: number = 0;

    /* STATUS AREA */
        MaxHP: number = 20;
        MaxAP: number = 1;

        ATK: number = 2;
        DEF: number = 1;

        SP: number = 0;

        get UpdateCache(): CacheStatus {
            let ATK = this.ATK;
            let PAN = 0;
            let FAT = 0;
            if (!isNullOrUndefined(this.WEAPON)) {
                ATK += this.WEAPON.attack;
                PAN = this.WEAPON.penetration;
                FAT = this.WEAPON.fatigue;
                if (this.WEAPON.type == Item.ItemType.GUN) {
                    if (isNullOrUndefined((this.WEAPON as Item.GUNTemplate).magazine)) {
                        ATK = 0; PAN = 0; FAT = 0;
                    }
                    else {
                        ATK += (this.WEAPON as Item.GUNTemplate).magazine.attack;
                        PAN += (this.WEAPON as Item.GUNTemplate).magazine.penetration;
                        FAT += (this.WEAPON as Item.GUNTemplate).magazine.fatigue;
                    }
                }
            }
            return {
                MaxHP: this.MaxHP,
                MaxAP: this.MaxAP,
                ATK: ATK,
                DEF: this.DEF + (!isNullOrUndefined(this.ARMOR) ? this.ARMOR.defence : 0),
                PAN: PAN,
                FAT: FAT
            };
        }

    /* ITEM AREA */
        ARMOR: Item.ArmorTemplate = null;
        issueArmorDamage() {
            if (isNullOrUndefined(this.ARMOR)) return false;
            else {
                this.ARMOR.durability--;
                if (this.ARMOR.durability < 1) {
                    this.ARMOR = null;
                    return true;
                }
                else
                    return false;
            }
        }
        WEAPON: Item.WeaponTemplate = null;
        issueWEAPONUse() {
            if (isNullOrUndefined(this.WEAPON)) return false;
            else {
                if (this.WEAPON.type == Item.ItemType.GUN && !isNullOrUndefined((this.WEAPON as Item.GUNTemplate).magazine)) {
                    (this.WEAPON as Item.GUNTemplate).magazine.amount--;
                    if ((this.WEAPON as Item.GUNTemplate).magazine.amount < 1) {
                        (this.WEAPON as Item.GUNTemplate).magazine = null;
                    }
                }
                this.WEAPON.durability--;
                if (this.WEAPON.durability < 1) {
                    if (this.WEAPON.type == Item.ItemType.GUN && !isNullOrUndefined((this.WEAPON as Item.GUNTemplate).magazine))
                        this.Inventory.push((this.WEAPON as Item.GUNTemplate).magazine)
                    this.WEAPON = null;
                    return true;
                }
                else
                    return false;
            }
        }
        Inventory: Array<Item.ItemTemplate> = [];
        useTacItem(i: string): Item.TacticalDisposableTemplate {
            let a = this.Inventory.findIndex(f => (f.type == Item.ItemType.ATK_DRUG || f.type == Item.ItemType.HEAL || f.type == Item.ItemType.TACCUSTOM) && f.name == i);
            if (a == -1)
                return null;
            else
                return this.Inventory.splice(a, 1)[0]; //splice ONE, return ONE
        }
        useStrItem(i: string): Item.StrategicDisposableTemplate {
            let a = this.Inventory.findIndex(f => (f.type == Item.ItemType.CUSTOM) && f.name == i);
            if (a == -1)
                return null;
            else
                return this.Inventory.splice(a, 1)[0];
        }
        Mount(i: string): boolean {
            let a = this.Inventory.findIndex(f => (f.type == Item.ItemType.WEAPON || f.type == Item.ItemType.ARMOR || f.type == Item.ItemType.GUN) && f.name == i);
            if (a == -1)
                return false;
            else {
                switch (this.Inventory[a].type) {
                    case Item.ItemType.WEAPON:
                    case Item.ItemType.GUN:
                        return this.MountWEAPON(i);
                    case Item.ItemType.ARMOR:
                        return this.MountArmor(i);
                }
            }
        }
        MountArmor(i: string): boolean {
            let a = this.Inventory.findIndex(f => f.type == Item.ItemType.ARMOR && f.name == i);
            if (a == -1)
                return false;
            else {
                if (!isNullOrUndefined(this.ARMOR))
                    this.Inventory.push(this.ARMOR);
                this.ARMOR = this.Inventory.splice(a, 1)[0] as Item.ArmorTemplate; //splice ONE, return ONE
                return true;
            }
        }
        MountWEAPON(i: string): boolean {
            let a = this.Inventory.findIndex(f => (f.type == Item.ItemType.WEAPON || f.type == Item.ItemType.GUN) && f.name == i);
            if (a == -1)
                return false;
            else {
                if (!isNullOrUndefined(this.WEAPON))
                    this.Inventory.push(this.WEAPON);
                this.WEAPON = this.Inventory.splice(a, 1)[0] as Item.WeaponTemplate; //splice ONE, return ONE
                return true;
            }
        }
        LoadMag(i: string): boolean {
            if (isNullOrUndefined(this.WEAPON) || this.WEAPON.type != Item.ItemType.GUN)
                return false;
            let a = this.Inventory.findIndex(f => f.type == Item.ItemType.MAGAZINE && (this.WEAPON as Item.GUNTemplate).bulletType == (f as Item.MagazineTemplate).bulletType && f.name == i);
            if (a == -1)
                return false;
            else {
                if (!isNullOrUndefined((this.WEAPON as Item.GUNTemplate).magazine))
                    this.Inventory.push((this.WEAPON as Item.GUNTemplate).magazine);
                (this.WEAPON as Item.GUNTemplate).magazine = this.Inventory.splice(a, 1)[0] as Item.MagazineTemplate; //splice ONE, return ONE
                return true;
            }
        }

    /* FUNCTION AREA */
        LevelUp(u: number, now: number) {
            for (let i = 0; i < u; i++) {
                this.MaxHP += StatusAvr.MaxHP * Math.floor((now - i) / 10);
                this.MaxAP += StatusAvr.MaxAP * Math.floor((now - i) / 10);

                this.ATK += StatusAvr.ATK * Math.floor((now - i) / 10);
                this.DEF += StatusAvr.DEF * Math.floor((now - i) / 10);

                this.SP += Math.floor((now - i) / 10);
            }
        }
        StatUp(t: StatusType, a: number): number {
            let doSP = Math.min(a, this.SP);
            let res = doSP * StatusAvr[t]
            this[t] += res;
            this.SP -= doSP;
            return res;
        }
        Kill() { this.KILL++; }
        Death() { this.DEATH++; }
        get JSON(): StatusRaw {
            return {
                KILL: this.KILL,
                DEATH: this.DEATH,
                MaxHP: this.MaxHP,
                MaxAP: this.MaxAP,
                ATK: this.ATK,
                DEF: this.DEF,
                SP: this.SP,
                ARMOR: this.ARMOR,
                WEAPON: this.WEAPON,
                Inventory: this.Inventory
            }
        }
        get Status() {
            return {
                P: {
                    TP: CustomType.FEED, ME: `스테이터스`, SID: 'GKB', DID: 'GKB',
                    SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                },
                C: {
                    THC: 1,
                    TI: {
                        TD: { T: `STATUS`, D: `KD:${+this.KILL.toFixed(3)}/${+this.DEATH.toFixed(3)} | HP:${+this.MaxHP.toFixed(3)} | AP:${+this.MaxAP.toFixed(3)} | ATK:${+this.ATK.toFixed(3)} | DEF:${+this.DEF.toFixed(3)} | STATPOINT:${+this.SP.toFixed(3)}` }
                    }
                }
            }
        }

    /* STATIC AREA */
        static CreateNew(lv: number) {
            let a = new UserStatus();
            a.LevelUp(lv,lv);
            return a;
        }
        static FromRaw(r: StatusRaw) {
            let a = new UserStatus();
            a.KILL = r.KILL;
            a.DEATH = r.DEATH;
            
            a.MaxHP = r.MaxHP;
            a.MaxAP = r.MaxAP;

            a.ATK = r.ATK;
            a.DEF = r.DEF;

            a.SP = r.SP;

            a.ARMOR = r.ARMOR;
            a.WEAPON = r.WEAPON;

            a.Inventory = r.Inventory;

            return a;
        }
    }
    export interface StatusRaw {
        KILL: number;
        DEATH: number;
        
        MaxHP: number;
        MaxAP: number;
        ATK: number;
        DEF: number;

        SP: number;

        ARMOR: Item.ArmorTemplate;
        WEAPON: Item.WeaponTemplate;

        Inventory: Array<Item.ItemTemplate>;
    }
    export enum StatusType {
        HP = 'MaxHP',
        AP = 'MaxAP',
        ATK = 'ATK',
        DEF = 'DEF'
    }
    export const StatusAvr = {
        MaxHP: 10,
        MaxAP: 0.3,
        ATK: 0.8,
        DEF: 0.5
    }

    export namespace Item {
        export enum ItemType {
            ARMOR = 'ARMOR',
            WEAPON = 'WEAPON',
            GUN = 'GUN',
            HEAL = 'HEALPOTION',
            ATK_DRUG = 'ATKPOTION',
            MAGAZINE = 'MAGAZINE',
            CUSTOM = 'CUSTOM',
            TACCUSTOM = 'TACCUSTOM'
        }
        export enum ItemTypeKR {
            ARMOR = '방어구',
            WEAPON = '무기',
            GUN = '총기',
            HEALPOTION = '체력회복제',
            ATKPOTION = '전투자극제',
            MAGAZINE = '탄창',
            CUSTOM = '기타 아이템',
            TACCUSTOM = '전술 아이템'
        }
        export interface ItemTemplate {
            name: string,
            description?: string,
            type: ItemType,
            levelLimit?: number
        }
        export interface ConsumableTemplate extends ItemTemplate {
            durability: number
        }
        export interface ArmorTemplate extends ConsumableTemplate {
            defence: number
        }
        export interface WeaponTemplate extends ConsumableTemplate {
            attack: number,
            penetration: number,
            fatigue: number
        }
        export interface GUNTemplate extends WeaponTemplate {
            bulletType: string,
            magazine: MagazineTemplate //DEF: NULL
        }
        export interface DisposableTemplate extends ItemTemplate { }
        export interface MagazineTemplate extends DisposableTemplate {
            bulletType: string;
            amount: number; //INTEGER
            attack: number;
            penetration: number;
            fatigue: number;
        }
        export interface TacticalDisposableTemplate extends DisposableTemplate { }
        export interface HEALTemplate extends TacticalDisposableTemplate {
            heal: number
        }
        export interface ATKTemplate extends TacticalDisposableTemplate {
            atk: number
        }
        export interface TacticalCustomTemplate extends TacticalDisposableTemplate {
            action: string //(status: UserStatus,battle: Battle) => any; //WARNING: REFER
        }
        export interface StrategicDisposableTemplate extends DisposableTemplate { }
        export interface CustomTemplate extends StrategicDisposableTemplate {
            action: string //(status: UserStatus,chat: Chat) => any; //WARNING: REFER
        }
        export function ItemInfoFeed(item: ItemTemplate) {
            let a = {
                THC: 1,
                TI: { TD: { T: `종류: ${ItemTypeKR[item.type]}`, D: `${isNullOrUndefined(item.description) ? '설명없음' : item.description}` } },
                PR: { TD: { T: `${item.name} ${isNullOrUndefined(item.levelLimit) ? '' : `(Lv.${item.levelLimit})`}` }, TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL } }
            }
            switch (item.type) {
                case ItemType.HEAL:
                    a['SO'] = { LK: (<HEALTemplate>item).heal };
                    break;
                case ItemType.ATK_DRUG:
                    a['SO'] = { LK: (<ATKTemplate>item).atk };
                    break;
                case ItemType.WEAPON:
                    a['TI']['TD']['D'] = `내구도:${(<WeaponTemplate>item).durability} | 피로도:${(<WeaponTemplate>item).fatigue} | ${isNullOrUndefined(item.description) ? '설명없음' : item.description}`
                    a['SO'] = { LK: (<WeaponTemplate>item).attack, SB: (<WeaponTemplate>item).penetration };
                    break;
                case ItemType.ARMOR:
                    a['TI']['TD']['D'] = `내구도:${(<ArmorTemplate>item).durability} | ${isNullOrUndefined(item.description) ? '설명없음' : item.description}`
                    a['SO'] = { SB: (<ArmorTemplate>item).defence };
                    break;
                case ItemType.GUN:
                    a['TI']['TD']['D'] = `내구도:${(<GUNTemplate>item).durability} | 피로도:${(<GUNTemplate>item).fatigue + (isNullOrUndefined((<GUNTemplate>item).magazine) ? 0 : (<GUNTemplate>item).magazine.fatigue)} | 탄창:${isNullOrUndefined((<GUNTemplate>item).magazine) ? (<GUNTemplate>item).bulletType : `${(<GUNTemplate>item).magazine.amount}발 ${(<GUNTemplate>item).magazine.name}`} | ${isNullOrUndefined(item.description) ? '설명없음' : item.description}`
                    a['SO'] = { LK: (<GUNTemplate>item).attack + (isNullOrUndefined((<GUNTemplate>item).magazine) ? 0 : (<GUNTemplate>item).magazine.attack), SB: (<GUNTemplate>item).penetration + (isNullOrUndefined((<GUNTemplate>item).magazine) ? 0 : (<GUNTemplate>item).magazine.penetration) };
                    break;
                case ItemType.MAGAZINE:
                    a['TI']['TD']['D'] = `잔탄:${(<MagazineTemplate>item).amount} | 피로도:${(<MagazineTemplate>item).fatigue} | 탄종:${(<MagazineTemplate>item).bulletType} | ${isNullOrUndefined(item.description) ? '설명없음' : item.description}`
                    a['SO'] = { LK: (<MagazineTemplate>item).attack, SB: (<MagazineTemplate>item).penetration };
                    break;
                case ItemType.CUSTOM:
                    break;
                case ItemType.TACCUSTOM:
                    break;
            }
            return a;
        }
    }

    export namespace Shop {
        export const ItemPath = `./res/coral/`//RUN AT app.ts
        export const ShopListPath = `${ItemPath}shop.json`
        export const RandomBotListPath = `${ItemPath}random.json`
        export var Items: Array<ShopItem> = [];
        export var Randoms: Array<RandomBox> = [];

        export function Load() {
            Items = jsonfile.readFileSync(ShopListPath);
            Randoms = jsonfile.readFileSync(RandomBotListPath);
        }

        export interface ShopItem {
            item: Item.ItemTemplate
            price: number
        }
        export interface RandomBox {
            name: string
            description?: string
            levelLimit: number
            items: Array<{ item: Item.ItemTemplate, rare: number }>
            price: number
        }

        function ShopItemInfo(item: ShopItem) {
            let a = {
                THC: 1,
                TI: { TD: { D: `${isNullOrUndefined(item.item.description) ? '설명없음' : item.item.description}` } },
                PR: { TD: { T: `${item.item.name} ${isNullOrUndefined(item.item.levelLimit) ? '' : `(Lv.${item.item.levelLimit})`}` }, TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL } },
                CMC: { RP: item.price }
            };
            switch (item.item.type) {
                case Item.ItemType.HEAL:
                    a['TI']['TD']['D'] = `회복: ${+(<Item.HEALTemplate>item.item).heal.toFixed(3)} | ${isNullOrUndefined(item.item.description) ? '설명없음' : item.item.description}`;
                    break;
                case Item.ItemType.ATK_DRUG:
                    a['TI']['TD']['D'] = `공격력: ${+(<Item.ATKTemplate>item.item).atk.toFixed(3)} | ${isNullOrUndefined(item.item.description) ? '설명없음' : item.item.description}`;
                    break;
                case Item.ItemType.WEAPON:
                    a['TI']['TD']['D'] = `내구도: ${+(<Item.WeaponTemplate>item.item).durability.toFixed(3)} | 공격력: ${+(<Item.WeaponTemplate>item.item).attack.toFixed(3)} | 관통: ${+(<Item.WeaponTemplate>item.item).penetration.toFixed(3)} | 피로도: ${+(<Item.WeaponTemplate>item.item).fatigue.toFixed(3)} | ${isNullOrUndefined(item.item.description) ? '설명없음' : item.item.description}`;
                    break;
                case Item.ItemType.ARMOR:
                    a['TI']['TD']['D'] = `내구도: ${+(<Item.ArmorTemplate>item.item).durability.toFixed(3)} | 방어력: ${+(<Item.ArmorTemplate>item.item).defence.toFixed(3)} | ${isNullOrUndefined(item.item.description) ? '설명없음' : item.item.description}`;
                    break;
                case Item.ItemType.GUN:
                    a['TI']['TD']['D'] = `내구도: ${+(<Item.GUNTemplate>item.item).durability.toFixed(3)} | 탄종: ${(<Item.GUNTemplate>item.item).bulletType} | 공격력: ${+(<Item.GUNTemplate>item.item).attack.toFixed(3)} | 관통: ${+(<Item.GUNTemplate>item.item).penetration.toFixed(3)} | 피로도: ${+(<Item.GUNTemplate>item.item).fatigue.toFixed(3)} | ${isNullOrUndefined(item.item.description) ? '설명없음' : item.item.description}`;
                    break;
                case Item.ItemType.MAGAZINE:
                    a['TI']['TD']['D'] = `탄종: ${(<Item.MagazineTemplate>item.item).bulletType} | 잔탄: ${+(<Item.MagazineTemplate>item.item).amount.toFixed(3)} | 공격력: ${+(<Item.MagazineTemplate>item.item).attack.toFixed(3)} | 관통: ${+(<Item.MagazineTemplate>item.item).penetration.toFixed(3)} | 피로도: ${+(<Item.MagazineTemplate>item.item).fatigue.toFixed(3)} | ${isNullOrUndefined(item.item.description) ? '설명없음' : item.item.description}`;
                    break;
            }
            return a;
        }
        function ShopRandomboxInfo(box: RandomBox) {
            return {
                THC: 1,
                TI: { TD: { D: `${box.items.length}개 아이템 등장 | ${isNullOrUndefined(box.description) ? '설명없음' : box.description}` } },
                PR: { TD: { T: `${box.name} ${isNullOrUndefined(box.levelLimit) ? '' : `(Lv.${box.levelLimit})`}` }, TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL } },
                CMC: { RP: box.price }
            };
        }
        export class CoralShopCommand extends CommandEvent {
            readonly command = '상점';
            HandlePrefix(chat: Chat) {
                chat.replyText(new ChatMention(chat.Channel.getUserInfo(chat.Sender)), '\u200b'.repeat(500), `
${KakaoBot.prefix}${this.command} 목록 - 구매할 수 있는 아이템 목록을 불러옵니다.
${KakaoBot.prefix}${this.command} 구매 <아이템 이름> - 아이템을 구매합니다. 장착/사용할 수 없는 무기는 구매할 수 없습니다
${KakaoBot.prefix}${this.command} 뽑기 - 랜덤박스 명령어`);
            }
            HandleArgs(chat: Chat, args: Array<string>) {
                switch (args[0]) {
                    case '목록': {
                        let a = new CustomAttachment();
                        a.readAttachment({
                            P: { TP: CustomType.CAROUSEL, ME: '아이템 목록', SID: 'GKB', DID: 'GKB', SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0' },
                            C: {
                                CTP: CustomType.COMMERCE,
                                CIL: Items
                                    .filter(e => isNullOrUndefined(e.item.levelLimit) || e.item.levelLimit <= Aquamarine.getUser(chat.Sender.Id, chat.Channel).level.level)
                                    .map(e => ShopItemInfo(e))
                            }
                        })
                        chat.replyTemplate(new AttachmentTemplate(a));
                    }
                        break;
                    case '구매': {
                        let info = Aquamarine.getUser(chat.Sender.Id, chat.Channel);
                        let a = Items
                            .filter(e => isNullOrUndefined(e.item.levelLimit) || e.item.levelLimit <= info.level.level)
                            .find(e => e.item.name == args.slice(1).join(' '));
                        if (isNullOrUndefined(a))
                            chat.replyText('알 수 없는 아이템');
                        else if (info.balance < a.price)
                            chat.replyText('돈이 부족합니다');
                        else {
                            Aquamarine.getUser(chat.Sender.Id, chat.Channel).status.Inventory.push(JSON.parse(JSON.stringify(a.item)) as any);
                            Aquamarine.getUser(chat.Sender.Id, chat.Channel).balance -= a.price;
                            let ife = Item.ItemInfoFeed(a.item);
                            ife.TI.TD.T = '구매완료';
                            let kl = new CustomAttachment();
                            kl.readAttachment({
                                P: {
                                    TP: CustomType.FEED, ME: `구매성공`, SID: 'GKB', DID: 'GKB',
                                    SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                                    SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                                },
                                C: ife
                            });
                            chat.replyTemplate(new AttachmentTemplate(kl));
                        }
                    }
                        break;
                    case '랜덤':
                    case '랜덤박스':
                    case '뽑기': {
                        if (args.length < 2)
                            chat.replyText(new ChatMention(chat.Channel.getUserInfo(chat.Sender)), '\u200b'.repeat(500), `
${KakaoBot.prefix}${this.command} 뽑기 목록 - 구매할 수 있는 랜덤박스 목록을 불러옵니다.
${KakaoBot.prefix}${this.command} 뽑기 구매 <아이템 이름> - 랜덤박스를 구매합니다. 자신보다 높은 레벨의 랜덤박스는 구매할 수 없습니다`);
                        else {
                            switch (args[1]) {
                                case '목록': {
                                    let a = new CustomAttachment()
                                    a.readAttachment({
                                        P: { TP: CustomType.CAROUSEL, ME: '랜덤박스 목록', SID: 'GKB', DID: 'GKB', SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0' },
                                        C: {
                                            CTP: CustomType.COMMERCE,
                                            CIL: Randoms
                                                .filter(e => isNullOrUndefined(e.levelLimit) || e.levelLimit <= Aquamarine.getUser(chat.Sender.Id, chat.Channel).level.level)
                                                .map(e => ShopRandomboxInfo(e))
                                        }
                                    })
                                    chat.replyTemplate(new AttachmentTemplate(a));
                                }
                                    break;
                                case '구매': {
                                    /* TODO */
                                    chat.replyText('준비중입니다');
                                }
                                    break;
                            }
                        }
                    }
                        break;
                }
            }
        }
    }
    export namespace Commands {
        export class CoralCommandCore extends CommandEvent {
            readonly command = '전투';
            readonly confirm = ['Y', 'y', '네', 'ㅇ'];
            HandlePrefix(chat: Chat) {
                chat.replyText(new ChatMention(chat.Channel.getUserInfo(chat.Sender)), '\u200b'.repeat(500), `
${KakaoBot.prefix}${this.command} 상태 - 상태창을 불러옵니다
${KakaoBot.prefix}${this.command} 스텟업 (HP|AP|ATK|DEF) <숫자> - 스텟포인트를 사용해 스텟을 상승시킵니다
${KakaoBot.prefix}${this.command} 신청 @유저맨션 - 전투를 신청합니다
${KakaoBot.prefix}${this.command} 인벤토리 - 아이템들을 불러옵니다`);
            }
            HandleArgs(chat: Chat, args: Array<string>) {
                switch (args[0]) {
                    case '상태':
                    case '스텟': {
                        if (!isNullOrUndefined(getCurrentBattle(chat.Sender.Id))) {
                            let stat = Aquamarine.getUser(chat.Sender.Id, chat.Channel).status;
                            let bt = getCurrentBattle(chat.Sender.Id);
                            let st = bt.getStatus(bt.isAttacker(chat.Sender.Id));
                            let b = new CustomAttachment();
                            let kl = {
                                P: { TP: CustomType.CAROUSEL, ME: `스테이터스`, SID: 'GKB', DID: 'GKB', SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0' },
                                C: {
                                    CTP: CustomType.FEED,
                                    CIL: [
                                        {
                                            THC: 1,
                                            TI: { TD: { T: `STATUS`, D: `체력:${+st.HP.toFixed(3)} | AP:${+st.AP.toFixed(3)}` } },
                                            PR: { TD: { T: chat.Channel.getUserInfo(chat.Sender).Nickname }, TH: { THU: chat.Channel.getUserInfo(chat.Sender).FullProfileImageURL, W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL } }
                                        }
                                    ]
                                }
                            };
                            if (!isNullOrUndefined(stat.WEAPON))
                                kl.C.CIL.push(Item.ItemInfoFeed(stat.WEAPON));
                            if (!isNullOrUndefined(stat.ARMOR))
                                kl.C.CIL.push(Item.ItemInfoFeed(stat.ARMOR));
                            b.readAttachment(kl);
                            chat.replyTemplate(new AttachmentTemplate(b));
                        }
                        else {
                            let stat = Aquamarine.getUser(chat.Sender.Id, chat.Channel).status;
                            let a = stat.Status;
                            a.C['PR'] = {
                                TD: { T: chat.Channel.getUserInfo(chat.Sender).Nickname },
                                TH: { THU: chat.Channel.getUserInfo(chat.Sender).FullProfileImageURL, W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                            }
                            let kl = {
                                P: { TP: CustomType.CAROUSEL, ME: `스테이터스`, SID: 'GKB', DID: 'GKB', SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0' },
                                C: { CTP: CustomType.FEED, CIL: [a.C] }
                            };
                            if (!isNullOrUndefined(stat.WEAPON))
                                kl.C.CIL.push(Item.ItemInfoFeed(stat.WEAPON));
                            if (!isNullOrUndefined(stat.ARMOR))
                                kl.C.CIL.push(Item.ItemInfoFeed(stat.ARMOR));
                            let b = new CustomAttachment(); b.readAttachment(kl);
                            chat.replyTemplate(new AttachmentTemplate(b));
                        }
                    }
                        break;
                    case '인벤토리':
                    case '인벤': {
                        let stat = Aquamarine.getUser(chat.Sender.Id, chat.Channel).status;
                        if (stat.Inventory.length < 1)
                            chat.replyText('보유중인 아이템이 없습니다');
                        else {
                            let a = new CustomAttachment();
                            a.readAttachment({
                                P: {
                                    TP: CustomType.CAROUSEL, ME: '인벤토리', SID: 'GKB', DID: 'GKB',
                                    SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                                },
                                C: {
                                    CTP: CustomType.FEED,
                                    CIL: stat.Inventory.map(e => Item.ItemInfoFeed(e))
                                }
                            });
                            chat.replyTemplate(new AttachmentTemplate(a));
                        }
                    }
                        break;
                    case '스텟업': {
                        if (args.length < 2)
                            chat.replyText('!전투 스텟업 (HP|AP|ATK|DEF) <숫자>');
                        else if (isNullOrUndefined(StatusType[args[1]]))
                            chat.replyText(`올바른 타입을 입력해주세요(HP|AP|ATK|DEF)`);
                        else {
                            let up = (isNullOrUndefined(args[2]) || isNaN(parseInt(args[2]))) ? 1 : parseInt(args[2]);
                            let res = Aquamarine.getUser(chat.Sender.Id, chat.Channel).status.StatUp(StatusType[args[1]], up);
                            chat.replyText(`스텟 ${args[1]}이 ${+res.toFixed(4)} 상승했습니다.`);
                        }
                    }
                        break;
                    case '신청': {
                        if (chat.getMentionContentList().length < 1)
                            chat.replyText('유저를 맨션해주세요');
                        else if (chat.Channel.getUserInfoId(chat.getMentionContentList()[0].UserId).User.isClientUser())
                            chat.replyText('봇은 싸울 수 없습니다');
                        else if (chat.Sender.Id.equals(chat.getMentionContentList()[0].UserId))
                            chat.replyText('자신과 싸울 수 없습니다');
                        else {
                            let info = chat.Channel.getUserInfoId(chat.getMentionContentList()[0].UserId);
                            chat.replyText(new ChatMention(info), '\n', `${chat.Channel.getUserInfo(chat.Sender).Nickname}님이 전투를 신청했습니다(결정:Y/n)`);
                            info.User.once('message', (oncechat) => {
                                if (!this.confirm.includes(oncechat.Text))
                                    chat.replyText('전투를 거부했습니다.');
                                else {
                                    if (!addBattle(chat.Sender.Id, info.Id, chat.Channel))
                                        chat.replyText('이미 전투중인 사람이 있습니다.');
                                    else {
                                        let at = Aquamarine.getUser(chat.Sender.Id, chat.Channel).status.Status;
                                        at.C['PR'] = {
                                            TD: { T: chat.Channel.getUserInfo(chat.Sender).Nickname },
                                            TH: { THU: chat.Channel.getUserInfo(chat.Sender).FullProfileImageURL, W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                                        }
                                        let vi = Aquamarine.getUser(oncechat.Sender.Id, chat.Channel).status.Status;
                                        vi.C['PR'] = {
                                            TD: { T: oncechat.Channel.getUserInfo(oncechat.Sender).Nickname },
                                            TH: { THU: oncechat.Channel.getUserInfo(oncechat.Sender).FullProfileImageURL, W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                                        }
                                        let cru = {
                                            P: { TP: CustomType.CAROUSEL, ME: '시작안내', SID: 'GKB', DID: 'GKB', SL: {}, VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0' },
                                            C: {
                                                CTP: CustomType.FEED,
                                                CIL: [
                                                    {
                                                        THC: 1,
                                                        TI: { TD: { T: `전투를 시작합니다!`, D: `':공격' 명령어를 사용하여 공격하세요! AP가 다 떨어지면 공격할 수 없습니다! ` } },
                                                        PR: { TD: { T: `전투 안내` }, TH: { THU: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg', W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL } }
                                                    }, at.C, vi.C
                                                ]
                                            }
                                        }
                                        let ct = new CustomAttachment(); ct.readAttachment(cru);
                                        oncechat.replyTemplate(new AttachmentTemplate(ct));
                                    }
                                }
                            });
                        }
                    }
                        break;
                }
            }
        }
        export class CoralCommandAttack extends CommandEvent {
            readonly command = '\u200b:공격'; //:공격
            Handle(chat: Chat) {
                let ch = getCurrentBattle(chat.Sender.Id);
                if (!isNullOrUndefined(ch)) {
                    let res = getCurrentBattle(chat.Sender.Id).attack(ch.isAttacker(chat.Sender.Id));
                    if (!res.dead) {
                        if (!res.attacked)
                            chat.replyText('AP가 부족합니다!');
                        else {
                            let a = new CustomAttachment(); a.readAttachment({
                                P: {
                                    TP: CustomType.FEED, ME: `스테이터스`,
                                    SID: 'GKB', DID: 'GKB',
                                    SNM: `Ch'en by HKLee`, SIC: 'https://leehyku.github.io/private/pictures/Chen/77845097_p0.jpg',
                                    SL: {},
                                    VA: '6.0.0', VI: '5.9.8', VW: '2.5.1', VM: '2.2.0'
                                },
                                C: {
                                    THC: 1,
                                    TI: {
                                        TD: {
                                            T: `데미지 ${res.damage.toFixed(3)}`,
                                            D: `현재 AP:${res.apnow.toFixed(3)} | 상대의 체력:${res.hpnow.toFixed(3)}`
                                        }
                                    },
                                    PR: {
                                        TD: { T: chat.Channel.getUserInfo(chat.Sender).Nickname },
                                        TH: { THU: chat.Channel.getUserInfo(chat.Sender).FullProfileImageURL, W: 200, H: 200, SC: CustomImageCropStyle.ORIGINAL }
                                    }
                                }
                            });
                            chat.replyTemplate(new AttachmentTemplate(a));
                        }
                    }
                }
            }
        }
        export class CoralItemEquip extends CommandEvent {
            readonly command = '\u200b:장착';
            HandleArgs(chat: Chat, args: Array<string>) {
                chat.replyText(Aquamarine.getUser(chat.Sender.Id, chat.Channel).status.Mount(args.join(' ')) ? '장착 완료' : '장착 실패');
                let a = getCurrentBattle(chat.Sender.Id)
                if (!isNullOrUndefined(a))
                    getCurrentBattle(chat.Sender.Id).updateCache(a.isAttacker(chat.Sender.Id));
            }
        }
        export class CoralItemUse extends CommandEvent {
            readonly command = '\u200b:사용';
            HandleArgs(chat: Chat, args: Array<string>) {
                let ch = getCurrentBattle(chat.Sender.Id);
                if (!isNullOrUndefined(ch)) {
                    let it = Aquamarine.getUser(chat.Sender.Id, chat.Channel).status.useTacItem(args.join(' '));
                    if (isNullOrUndefined(it))
                        chat.replyText('사용 불가');
                    else {
                        getCurrentBattle(chat.Sender.Id).useItem(ch.isAttacker(chat.Sender.Id), it);
                        chat.replyText(`아이템 ${it.name}을 사용했습니다`);
                    }
                }
                else {
                    let it = Aquamarine.getUser(chat.Sender.Id, chat.Channel).status.useStrItem(args.join(' '));
                    if (isNullOrUndefined(it))
                        chat.replyText('사용 불가');
                    else {
                        switch (it.type) {
                            case Item.ItemType.CUSTOM:
                                new Function("status", "chat", (it as Item.CustomTemplate).action)(Aquamarine.getUser(chat.Sender.Id, chat.Channel).status, chat);
                                break;
                        }
                    }
                }
            }
        }
        export class CoralLoadMag extends CommandEvent {
            readonly command = '\u200b:장전';
            HandleArgs(chat: Chat, args: Array<string>) {
                chat.replyText(`장전 ${Aquamarine.getUser(chat.Sender.Id, chat.Channel).status.LoadMag(args.join(' ')) ? '완료' : '실패'}`);
            }
        }
        export class CoralGiveup extends CommandEvent{
            readonly command = '\u200b:항복';

            Handle(chat: Chat){
                let battle = getCurrentBattle(chat.Sender.Id);
                if(!isNullOrUndefined(battle))
                    getCurrentBattle(chat.Sender.Id).setWinner(!battle.isAttacker(chat.Sender.Id));
            }
        }
    }
}