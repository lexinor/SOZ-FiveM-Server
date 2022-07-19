import { ResultSetHeader } from 'mysql2';

import { TwitchNewsMessage } from '../../../typings/twitch-news';
import DbInterface from '../db/db_wrapper';

export class _TwitchNewsDB {
    async addNews({ type, image, message, reporter, reporterId }: TwitchNewsMessage): Promise<number> {
        const query = `INSERT INTO phone_twitch_news (type, image, message, reporter, reporterId) VALUES (?, ?, ?, ?, ?)`;
        const [setResult] = await DbInterface._rawExec(query, [type, image, message, reporter, reporterId]);
        return (<ResultSetHeader>setResult).insertId;
    }

    async getNews(): Promise<TwitchNewsMessage[]> {
        const query = `SELECT *, unix_timestamp(createdAt)*1000 as createdAt FROM phone_twitch_news WHERE createdAt > date_sub(now(), interval 2 day)`;
        const [result] = await DbInterface._rawExec(query, []);
        return <TwitchNewsMessage[]>result;
    }
}

const TwitchNewsDb = new _TwitchNewsDB();
export default TwitchNewsDb;