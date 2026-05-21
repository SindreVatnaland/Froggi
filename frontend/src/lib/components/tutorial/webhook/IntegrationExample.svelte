<h1 class="text-2xl font-semibold">Receiving events</h1>

<h2>
	Any HTTP server can receive Froggi webhooks. Below is a minimal Node.js example using Express
	that listens for events and logs the payload.
</h2>

<pre class="code-block">{`import express from 'express';

const app = express();
app.use(express.json());

const SECRET = 'your-bearer-token';

app.post('/froggi', (req, res) => {
  const auth = req.headers['authorization'];
  if (auth !== \`Bearer \${SECRET}\`) {
    return res.sendStatus(401);
  }

  const { eventName, timestamp, payload } = req.body;

  switch (eventName) {
    case 'GameStart':
      console.log('Game started on stage', payload.stageId);
      break;
    case 'GameEnd':
      console.log('Game ended, score:', payload.score);
      break;
    case 'RankChange':
      console.log(\`\${payload.displayName} rating: \${payload.diff.rating:+.1f}\`);
      break;
    case 'PercentChange':
      console.log('Current player %:', payload.currentPlayer?.current);
      break;
    case 'StockChange':
      console.log('Stocks:', payload.p1?.current, payload.p2?.current);
      break;
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log('Listening on :3000'));`}</pre>

<h2>
	The server must respond with a <b>2xx</b> status code. Any other response is treated as a failure
	and logged.
</h2>

<h2>Key points:</h2>

<ul>
	<li>Always validate the <code>Authorization</code> header before processing.</li>
	<li>
		Respond quickly — do heavy work asynchronously so the response is not delayed.
	</li>
	<li>
		<code>PercentChange</code> and <code>StockChange</code> fire at game speed. Keep handlers lightweight
		or filter to only what you need.
	</li>
	<li>
		<code>currentPlayer</code> is <code>null</code> if no connect code is linked in Froggi settings.
	</li>
</ul>

<style>
	h1,
	h2 {
		color: var(--secondary-color);
	}

	code {
		font-family: monospace;
		font-size: 0.8rem;
		opacity: 0.75;
	}

	.code-block {
		font-family: monospace;
		font-size: 0.7rem;
		line-height: 1.65;
		opacity: 0.65;
		padding: 1rem;
		border: 1px solid rgba(128, 128, 128, 0.2);
		border-radius: 0.375rem;
		white-space: pre;
		overflow-x: auto;
		margin: 0.25rem 0;
		color: var(--secondary-color);
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-left: 1.25rem;
		margin-top: 0.25rem;
	}

	li {
		color: var(--secondary-color);
		font-size: 0.875rem;
		opacity: 0.75;
		list-style: disc;
		line-height: 1.5;
	}
</style>
