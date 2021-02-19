import fetch from "node-fetch";

export namespace GET {
    export async function json(link: string):Promise<any> {
        try {
            let a = await fetch(encodeURI(link));
            return await a.json();
        }
        catch (e) {
            throw e;
        }
    }
    export async function normal(link: string): Promise<string> {
        try {
            let a = await fetch(encodeURI(link));
            return await a.text();
        }
        catch (e) {
            throw e;
        }
    }
}