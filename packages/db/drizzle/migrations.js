// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_many_doctor_doom.sql';
import m0001 from './0001_typical_vivisector.sql';
import m0002 from './0002_lumpy_kat_farrell.sql';
import m0003 from './0003_sour_triton.sql';
import m0004 from './0004_currency_byn.sql';
import m0005 from './0005_category_icons.sql';
import m0006 from './0006_overrated_jubilee.sql';
import m0007 from './0007_magical_sway.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006,
m0007
    }
  }
  