const bitbar = require('bitbar');
const fetch = require('node-fetch').default;
const { format, parseISO } = require('date-fns');

const OPTIONS = {
  FOOTBALL_DATA_API_KEY: USER_OPTIONS && USER_OPTIONS.FOOTBALL_DATA_API_KEY,
  TEAM_ID: USER_OPTIONS && USER_OPTIONS.TEAM_ID || 73,
  NUMBER_OF_FINISHED_MATCHES: USER_OPTIONS && USER_OPTIONS.NUMBER_OF_FINISHED_MATCHES || 4,
  NUMBER_OF_SCHEDULED_MATCHES: USER_OPTIONS && USER_OPTIONS.NUMBER_OF_SCHEDULED_MATCHES || 3,
};

(async () => {
  const apiUrl = 'https://api.football-data.org/v2';
  const apiData = {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': OPTIONS.FOOTBALL_DATA_API_KEY,
    },
  };

  // Get team info
  const myTeamResponse = await fetch(`${apiUrl}/teams/${OPTIONS.TEAM_ID}`, apiData)
  const myTeam = await myTeamResponse.json();

  // Get active competitions standings
  const activeCompetitionsPromises = myTeam.activeCompetitions.map((comp) => fetch(`${apiUrl}/competitions/${comp.id}/standings?standingType=TOTAL`, apiData));
  const activeCompetitionsPromisesResponses = await Promise.all(activeCompetitionsPromises);
  const activeCompetitionsStandings = await Promise.all(activeCompetitionsPromisesResponses.map((resp) => resp.json()));
  let activeCompetitionsStandingsRender = [];
  activeCompetitionsStandings.forEach((comp) => {
    activeCompetitionsStandingsRender = [
      ...activeCompetitionsStandingsRender,
      {
        text: comp.competition.name,
        href: `https://www.google.com/search?q=${comp.competition.name.split(' ').join('+')}`,
        size: 14,
        submenu: comp.standings.map((standing) => ({
          text: standing.stage === 'GROUP_STAGE' ? standing.group : standing.stage,
          size: 14,
          submenu: [
            { text: 'Pos. Team - Points' },
            bitbar.separator,
            ...standing.table.map((table, idx) => {
              return ({
                text: `${
                  table.position
                }. ${
                  table.team.name
                } - ${
                  table.points
                }`,
                ...(table.team.id === OPTIONS.TEAM_ID && { font: 'Helvetica-Bold' }),
              })
            }),
          ],
        })),
      },
    ];
  });

  // Get finished matches
  // NOTE: I would limit the API request to the requested number of finished matches
  // but there's no way to get the 4 most recent completed games.
  const finishedMatchesResponse = await fetch(
    `${apiUrl}/teams/${OPTIONS.TEAM_ID}/matches?status=FINISHED`,
    apiData
  );
  const finishedMatches = await finishedMatchesResponse.json();
  let finishedMatchesRender = [];
  if (finishedMatches.matches) {
    finishedMatches.matches.forEach((match, idx) => {
      if (idx >= finishedMatches.matches.length - OPTIONS.NUMBER_OF_FINISHED_MATCHES) {
        // Determine winner
        const isDraw = match.score.winner === 'DRAW';
        let winningTeamName = 'Draw';
        if (match.score.winner === 'HOME_TEAM') {
          winningTeamName = match.homeTeam.name
        } else if (match.score.winner === 'AWAY_TEAM') {
          winningTeamName = match.awayTeam.name
        }
        const myTeamWon = winningTeamName === myTeam.name;
        // Check if there was extra time
        const showExtraTime = (match.score.extraTime.homeTeam || match.score.extraTime.awayTeam);
        // Check if there were penalties
        const showPenalties = (match.score.penalties.homeTeam || match.score.penalties.awayTeam);
        // Render regular scores
        const regularScoreRender = `${match.score.fullTime.homeTeam} - ${match.score.fullTime.awayTeam}`;
        // Render extra time scores
        const extraTimeRender = ` (ET: ${match.score.extraTime.homeTeam} - ${match.score.extraTime.awayTeam})`;
        // Render extra time scores
        const penaltiesRender = ` (Pen: ${match.score.penalties.homeTeam} - ${match.score.penalties.awayTeam})`;
        finishedMatchesRender = [
          ...finishedMatchesRender,
          {
            text: `${match.homeTeam.name} vs. ${match.awayTeam.name}`,
            size: 14,
            href: `https://www.google.com/search?q=${match.homeTeam.name.split(' ').join('+')}+vs.+${match.awayTeam.name.split(' ').join('+')}`,
          },
          {
            text: `${myTeamWon ? '🟢' : isDraw ? '⚪️' : '🔴'} ${regularScoreRender}${showExtraTime ? extraTimeRender : ''}${showPenalties ? penaltiesRender : ''} ${!isDraw ? winningTeamName : 'Draw'}`,
            size: 14,
          },
        ];
      }
    });
  }

  // Get scheduled matches
  const scheduledMatchesResponse = await fetch(
    `${apiUrl}/teams/${OPTIONS.TEAM_ID}/matches?status=SCHEDULED&limit=${OPTIONS.NUMBER_OF_SCHEDULED_MATCHES}`,
    apiData
  );
  const scheduledMatches = await scheduledMatchesResponse.json();
  let scheduledMatchesRender = [];
  if (scheduledMatches.matches) {
    scheduledMatches.matches.forEach((match) => {
      scheduledMatchesRender = [
        ...scheduledMatchesRender,
        {
          text: `${match.homeTeam.name} vs. ${match.awayTeam.name}`,
          size: 14,
          href: `https://www.google.com/search?q=${match.homeTeam.name.split(' ').join('+')}+vs.+${match.awayTeam.name.split(' ').join('+')}`,
        },
        {
          text: `${format(parseISO(match.utcDate), 'MM/dd/yyyy - hh:mm a')}`,
          size: 14,
        },
      ];
    });
  }

  // Get live matches
  const liveMatchesResponse = await fetch(`https://api.football-data.org/v2/teams/${OPTIONS.TEAM_ID}/matches?status=LIVE`, apiData)
  const liveMatches = await liveMatchesResponse.json();
  let liveMatchesRender = [];
  if (liveMatches.matches) {
    liveMatches.matches.forEach((match) => {
      // Determine winner
      let winningTeamName = 'Draw';
      if (match.score.winner === 'HOME_TEAM') {
        winningTeamName = match.homeTeam.name
      } else if (match.score.winner === 'AWAY_TEAM') {
        winningTeamName = match.awayTeam.name
      }
      const myTeamIsWinning = winningTeamName === myTeam.name;
      // Check if there was extra time
      const showExtraTime = (match.score.extraTime.homeTeam || match.score.extraTime.awayTeam);
      // Check if there were penalties
      const showPenalties = (match.score.penalties.homeTeam || match.score.penalties.awayTeam);
      // Render regular scores
      const regularScoreRender = `(${match.score.fullTime.homeTeam} - ${match.score.fullTime.awayTeam})`;
      // Render extra time scores
      const extraTimeRender = `(ET: ${match.score.extraTime.homeTeam} - ${match.score.extraTime.awayTeam})`;
      // Render extra time scores
      const penaltiesRender = `(Pen: ${match.score.penalties.homeTeam} - ${match.score.penalties.awayTeam})`;
      liveMatchesRender = [
        ...liveMatchesRender,
        {
          text: `${match.homeTeam.name} vs. ${match.awayTeam.name}`,
          size: 14,
        },
        {
          text: `${regularScoreRender}${showExtraTime ? extraTimeRender : ''}${showPenalties ? penaltiesRender : ''}`,
          size: 13,
        },
      ];
    });
  }

  // Prepare render sections
  const activeCompetitionsStandingsSection = activeCompetitionsStandingsRender.length ? [
    bitbar.separator,
    { text: 'Standings', size: 22 },
    ...activeCompetitionsStandingsRender,
  ] : [];
  const finishedMatchesSection = finishedMatchesRender.length ? [
    bitbar.separator,
    { text: 'Completed Matches', size: 22 },
    ...finishedMatchesRender,
  ] : [];
  const scheduledMatchesSection = scheduledMatchesRender.length ? [
    bitbar.separator,
    { text: 'Upcoming Matches', size: 22 },
    ...scheduledMatchesRender,
  ] : [];
  const liveMatchesSection = liveMatchesRender.length ? [
    bitbar.separator,
    { text: 'Live Matches', size: 22 },
    ...liveMatchesRender,
  ] : [];

  // Render the bitbar dropdown
  bitbar([
    {
      text: '⚽︎', // TODO: make a cool logo
      dropdown: false
    },
    bitbar.separator,
    {
      text: myTeam.name,
      size: 30,
      href: myTeam.website,
    },
    ...activeCompetitionsStandingsSection,
    ...finishedMatchesSection,
    ...scheduledMatchesSection,
    ...liveMatchesSection,
  ]);
})();