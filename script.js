const mysql = require("mysql2/promise");
const csv = require("convert-csv-to-json");

const match = "WorldCupMatches.csv";

const config = {
  user: "",
  password: "",
  server: "",
  database: ""
};

const SIM = "Sim";
const NAO = "Nao";

(async function initDatabase() {
  const sql = await mysql.createConnection(config);

  const matches = csv.fieldDelimiter(",").getJsonFromCsv(match);

  for (const data of matches) {
    try {
      if (data.HomeTeamName === 'Brazil' || data.AwayTeamName === 'Brazil') {

        const playing_home = data.HomeTeamName === 'Brazil' ? SIM : NAO;
        const special_condition = data.Winconditions.length > 5 ? SIM : NAO;
        const is_group = data.Stage.split(' ')[0] === 'Group' ? SIM : NAO;
        const opponent = playing_home === SIM ? data.AwayTeamName : data.HomeTeamName;

        let is_winner = NAO;

        if (playing_home === SIM) {
          is_winner = parseInt(data.HomeTeamGoals) > parseInt(data.AwayTeamGoals) && SIM;
        } else {
          is_winner = parseInt(data.AwayTeamGoals) > parseInt(data.HomeTeamGoals) && SIM;
        }

        const brazil_game = { playing_home, opponent, special_condition, is_group, is_winner };


        console.log("\nINSERINDO PARTIDA: ", data.MatchID);
        await insertBrazilGame(sql, brazil_game);
      }
    } catch (error) {
      console.log(error);

      continue;
    }
  }

  console.log("DONE");
  process.exit(0);
})();

async function insertBrazilGame(sql, game) {

  await sql.execute(`INSERT INTO JOGOS_BRASIL (
    adversario, condicao_especial, jogando_em_casa, fase_de_grupo, venceu) VALUE (?, ?, ?, ?, ?)`,
    [game.opponent, game.special_condition, game.playing_home, game.is_group, game.is_winner]);
}
