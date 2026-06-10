// TEMPORARY — type specimen page. Delete when design system typography is settled.
export function TypographyPage() {
  return (
    <div className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl px-8 py-12">

      <section>
        <h1>Journey to the Center of the Earth</h1>
        <h2>Part One: The Discovery</h2>
        <h3>Chapter I — My Uncle, Professor Lidenbrock</h3>
        <h4>The Runic Manuscript</h4>
        <h5>A Message from Arne Saknussemm</h5>
        <h6>Descent into the Unknown</h6>
      </section>

      <hr />

      <section>
        <h2>Paragraphs</h2>
        <p>
          On the 24th of May, 1863, my uncle, Professor Lidenbrock, rushed towards his little house in the
          old part of Hamburg. Martha, his housekeeper, must have concluded that she was very much behind
          time, for the dinner had only just been put into the oven.
        </p>
        <p>
          "Well, now," said I to myself, "if this man is in a hurry, nothing can satisfy him; but if the
          hunger comes upon him, he will cry out furiously for his dinner."
        </p>
        <p>
          Professor Otto Lidenbrock was not a bad sort of man, I fully admit; but unless he mightily changes,
          he will end by being a very eccentric one. He was professor at the Johanneum, and was delivering a
          series of lectures on mineralogy, during each of which he broke into a passion once or twice at least.
        </p>
      </section>

      <hr />

      <section>
        <h2>Blockquote</h2>
        <blockquote>
          <p>
            "Science, my lad, is made up of mistakes, but they are mistakes which it is useful to make,
            because they lead little by little to the truth."
          </p>
          <p>— Professor Lidenbrock</p>
        </blockquote>
      </section>

      <hr />

      <section>
        <h2>Inline styles</h2>
        <p>
          The professor was <strong>short-sighted</strong>, but possessed <em>remarkable penetration</em> of
          intellect. He read with avidity all the works of <strong><em>science and philosophy</em></strong>{' '}
          that had been published in any language. The word <u>Sneffels</u> he had just uttered was the name
          of a volcano in Iceland, and it was believed to be extinct.
        </p>
        <p>
          This is text with <code>inline code</code> inside a sentence, and here is a{' '}
          <a href="#">hyperlink to somewhere</a> that goes nowhere in particular.
        </p>
        <p>
          Small text: <small>This text is small, used for captions or fine print.</small>
        </p>
        <p>
          Marked text: <mark>This passage has been highlighted</mark> for emphasis.
        </p>
        <p>
          Deleted and inserted: <del>the old measurement</del> <ins>the corrected value</ins>.
        </p>
        <p>
          Superscript: E = mc<sup>2</sup>. Subscript: H<sub>2</sub>O.
        </p>
      </section>

      <hr />

      <section>
        <h2>Unordered list</h2>
        <ul>
          <li>A compass, a thermometer, and a manometer</li>
          <li>A chronometer by Boissonnas and Erdmann of Geneva</li>
          <li>Two Ruhmkorff coils</li>
          <li>
            Provisions for six months
            <ul>
              <li>Dried meat and biscuits</li>
              <li>Schiedam gin and rum</li>
              <li>Tea, coffee, and sugar</li>
            </ul>
          </li>
          <li>Climbing apparatus: ropes, crampons, and ice-axes</li>
        </ul>
      </section>

      <section>
        <h2>Ordered list</h2>
        <ol>
          <li>Depart Hamburg by rail to Kiel</li>
          <li>Sail from Kiel to Reykjavik aboard the Valkyrie</li>
          <li>Ride to the village of Stapi on horseback</li>
          <li>Ascend the crater of Sneffels</li>
          <li>Descend through the shadow of Scartaris</li>
          <li>Reach the center of the earth</li>
        </ol>
      </section>

      <hr />

      <section>
        <h2>Table</h2>
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Purpose</th>
              <th>Reading</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Thermometer</td>
              <td>Measure ambient temperature</td>
              <td>15 °C</td>
            </tr>
            <tr>
              <td>Manometer</td>
              <td>Measure atmospheric pressure</td>
              <td>1.0 atm</td>
            </tr>
            <tr>
              <td>Compass</td>
              <td>Track magnetic bearing</td>
              <td>N 14° E</td>
            </tr>
            <tr>
              <td>Chronometer</td>
              <td>Precise timekeeping</td>
              <td>GMT +0</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>All instruments verified before departure, Hamburg, May 1863.</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <hr />

      <section>
        <h2>Code block</h2>
        <pre><code>{`// Runic cipher decoded by Professor Lidenbrock
const message = "In Sneffels Yoculis craterem kem delibat
umbra Scartaris Julii intra calendas descende,
audax viator, et terrestre centrum attinges.
Kod feci. Arne Saknussemm.";

function decodeRunic(cipher: string): string {
  const alphabet = "saknussemm";
  return cipher
    .split("")
    .map((char) => alphabet.indexOf(char))
    .filter((i) => i !== -1)
    .join("-");
}`}</code></pre>
      </section>

      <section>
        <h2>Inline code</h2>
        <p>
          The coordinate of Sneffels is approximately <code>64.808° N, 23.776° W</code>. The crater depth
          was measured as <code>2,119 m</code> from the summit. We used <code>rope.descend()</code> to begin
          the initial approach.
        </p>
      </section>

      <hr />

      <section>
        <h2>Definition list</h2>
        <dl>
          <dt>Runic alphabet</dt>
          <dd>
            An ancient writing system used by Germanic peoples, including Old Norse. The cipher in the
            manuscript was a transposition of the Latin alphabet through runic characters.
          </dd>
          <dt>Sneffels</dt>
          <dd>
            A stratovolcano in western Iceland, standing 1,446 m above sea level. Believed extinct at the
            time of the expedition.
          </dd>
          <dt>Scartaris</dt>
          <dd>
            A peak adjacent to Sneffels whose shadow points to the correct crater entrance at the end
            of June, as described in Saknussemm's manuscript.
          </dd>
        </dl>
      </section>

      <hr />

      <section>
        <h2>Horizontal rule</h2>
        <p>A horizontal rule separates sections of content:</p>
        <hr />
        <p>Content resumes below the rule.</p>
      </section>

    </div>
  )
}
