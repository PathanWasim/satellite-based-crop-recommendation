# Understanding our project: Post-Quantum Satellite Communication Security

**Purpose of this document:** Every group member should be able to read this once and explain the project confidently — what problem we're solving, why it matters, how our demo works, and what the numbers mean. No prior cryptography background assumed.

---

## 1. The problem, in one paragraph

Satellites — GPS, communication satellites, Starlink-style constellations — get launched with whatever encryption they had on launch day, and that encryption **cannot be patched** the way you'd patch a phone or laptop. A satellite flies for 10–15+ years. Meanwhile, powerful state actors are already **recording encrypted satellite traffic today**, betting that in 10–15 years quantum computers will be powerful enough to break today's encryption and unlock everything they recorded. This is called **"harvest now, decrypt later" (HNDL)**. Since you can't send a technician to fix a satellite's crypto chip after launch, this is one of the purest "you get exactly one shot" problems in all of cybersecurity.

**Our project:** build a simulated satellite ↔ ground station link, encrypt it two different ways (old method vs. new quantum-resistant method), and actually measure — not guess — how much extra computing power, battery, and bandwidth the new method costs. Then answer: is it affordable on real, constrained satellite hardware?

---

## 2. Why can't we just "wait and see" if quantum computers happen?

Because of the **timeline mismatch**:

| | Timeline |
|---|---|
| Satellite launched today | Operates until ~2036–2041 |
| Quantum computer capable of breaking today's encryption | Experts disagree on exact date, but many government agencies (NIST, NSA) are already telling organizations to migrate *now* |
| A satellite's crypto | Fixed forever at launch |

If we wait until quantum computers are actually here to start migrating, every satellite already in orbit is stuck with broken cryptography for the rest of its life, and every recording an adversary made years earlier becomes readable. The only window to fix this is **before launch**. That's why NIST (the US standards body) finalized official quantum-resistant standards in August 2024 — the whole industry is in a race to adopt them before it's too late.

---

## 3. Glossary — the vocabulary you need for Q&A

| Term | Plain-English meaning |
|---|---|
| **Encryption** | Scrambling data so only someone with the right key can read it. |
| **Key exchange** | The process two computers use to agree on a shared secret key *before* they start encrypting messages to each other, done over a channel that might be watched. |
| **ECDH** (Elliptic Curve Diffie-Hellman) | The *classical* key-exchange method almost everything uses today (websites, apps, satellites). Based on a math problem (elliptic curve discrete log) that's hard for regular computers but provably easy for a quantum computer. |
| **AES-GCM** | The symmetric encryption that actually scrambles the data once both sides have a shared key. This part is *not* threatened by quantum computers in the same way — it stays in our design either way. |
| **ML-KEM** (formerly called "Kyber") | The new *post-quantum* key-exchange method, standardized by NIST as FIPS 203 in 2024. Based on lattice math, which (as far as we know) stays hard even for quantum computers. |
| **ML-DSA** (formerly called "Dilithium") | The post-quantum equivalent of a digital signature (used to prove "this message really came from the satellite / ground station and wasn't tampered with"). Standardized as FIPS 204. |
| **PQC** | "Post-Quantum Cryptography" — the umbrella term for all quantum-resistant algorithms. |
| **Quantum computer threat (Shor's algorithm)** | A quantum algorithm that can solve the exact math problems ECDH/RSA rely on, in a fraction of the time a normal computer needs. This is *why* ECDH is considered doomed long-term — it's not a guess, it's a known algorithm, we just don't have a big enough quantum computer to run it yet. |
| **Harvest now, decrypt later (HNDL)** | Recording encrypted traffic today, storing it, and decrypting it once quantum computers are strong enough. |
| **Handshake** | The initial "hello, let's agree on a secret key" exchange at the start of a session — this is the part we're comparing (classical vs. PQC), not the whole conversation. |
| **Overhead** | The "cost" of doing something — here, extra time, extra CPU, extra battery, extra bytes sent over the radio link. |
| **On-board computer (OBC)** | The satellite's onboard "brain" — often much weaker than a phone CPU because it has to survive radiation and run on very limited power. |
| **CubeSat** | A small, cheap, standardized satellite (often the size of a loaf of bread), representing the *most* resource-constrained end of the spectrum we're testing. |

---

## 4. How the two approaches actually work (with an analogy)

Think of the satellite and ground station as two people who want to agree on a secret password before whispering to each other, while someone is listening nearby.

### Classical approach: ECDH + AES

```
Satellite  ──ECDH (agree on secret)──►  Shared Secret  ──►  AES encrypts the actual data  ──►  Ground Station
```

- Fast, small (a 32-byte public key — tiny).
- The math behind ECDH is like a locked box that's *currently* impossible to pick — but a quantum computer would eventually be able to pick it, and an eavesdropper who saved the locked box today can pick it once they have that quantum computer.

### Post-quantum approach: ML-KEM + AES-GCM

```
Satellite  ──ML-KEM (agree on secret)──►  Post-Quantum Shared Secret  ──►  AES-GCM encrypts the data  ──►  Ground Station
```

- Same idea (agree on a secret, then encrypt), but the *lock* used to agree on that secret is a completely different kind of math (lattice problems) that quantum computers, as far as anyone currently knows, are *not* good at breaking.
- The trade-off: the "key" and "ciphertext" involved are much bigger — for ML-KEM-768, about **1,184 bytes (public key) + 1,088 bytes (ciphertext)**, versus just **32 bytes** for classical ECDH. That's roughly **70× more data** just to say "let's agree on a secret."

**This is the entire research question of our project:** ML-KEM's *math* is actually fast — sometimes even faster than ECDH. The real cost is **size**, and size costs bandwidth, and bandwidth costs time-on-the-radio and battery. We built a demo and a benchmark plan specifically to measure that trade-off instead of assuming it.

---

## 5. Our system architecture (what we're actually building)

```
                       SATELLITE
                          │
                 ┌────────┴────────┐
                 │                 │
             Sensors           Telemetry
        (fake GPS/altitude/    (battery %,
         temperature data)      position)
                 │                 │
                 └────────┬────────┘
                          ▼
                  PQC Crypto Layer
                 ┌────────┴────────┐
                 │                 │
              ML-KEM             ML-DSA
          (key exchange)      (authentication /
                                 signatures)
                 └────────┬────────┘
                          ▼
                   Secure Channel
                          │
                     [Attacker taps here,
                      records everything]
                          │
                          ▼
                   GROUND STATION
                 ┌────────┴────────┐
                 │                 │
            Decryption        Verification
                 └────────┬────────┘
                          ▼
                    Mission Data
```

### The pieces, explained

1. **Satellite node** — generates fake but realistic telemetry (altitude, temperature, battery %, position), like a satellite would.
2. **Crypto layer** — swappable: run it in "classical mode" (ECDH + AES) or "PQC mode" (ML-KEM + AES-GCM + ML-DSA signatures). Same interface, different math underneath, so we can flip a switch and compare.
3. **Simulated radio channel** — adds realistic delay and a limited bit rate (a real satellite doesn't have unlimited bandwidth — some CubeSats talk over slow UHF radio links).
4. **Attacker module** — silently records every packet sent, just like a real state-level eavesdropper would. It doesn't *do* anything malicious to us — it exists to make the "harvest now, decrypt later" threat visible in our demo instead of just a theoretical claim.
5. **Ground station node** — receives, decrypts, and verifies. If verification fails, it rejects the data (never guesses / never accepts something it can't verify).
6. **Benchmark harness** — the "stopwatch and scale" of the project: it wraps every handshake and measures time, CPU %, memory, and bytes transmitted, for both classical and PQC, across three satellite "difficulty settings."

### Three satellite profiles (this is important for our recommendation)

| Profile | Represents | Compute | Our recommendation |
|---|---|---|---|
| **A — high compute** | Modern satellite bus with a real applications processor | Plenty of headroom | ML-KEM-1024 + ML-DSA-87 (max security, overhead barely matters) |
| **B — medium compute** | Typical smallsat on-board computer | Some constraints | ML-KEM-768, possibly hybrid with classical during a transition period |
| **C — extremely constrained** | CubeSat-class microcontroller (think: a Raspberry Pi Pico–class chip, 133 MHz, 264 KB RAM) | Very tight | ML-KEM-512 only, and batch telemetry to spread the handshake cost over fewer sessions |

**Real data point that surprised us:** a published benchmark on exactly this class of tiny chip (ARM Cortex-M0+ / RP2040, 133 MHz) found that a *full* ML-KEM-512 key exchange took **35.7 milliseconds** and used about **2.83 millijoules** of energy — and that this was actually **~17× faster** than a classical ECDH (P-256) exchange on the *same* chip. So "PQC is slow" is not automatically true — it depends heavily on which algorithm and which classical baseline you're comparing against.

---

## 6. Walking through the live demo (what you'll show in the presentation)

We built an interactive visual (shown in chat, can also be screen-recorded) with these parts:

1. **Satellite ↔ Ground Station diagram** with an "Intercepting" eye icon in the middle — this represents the attacker who is always listening, whether we're in classical or PQC mode.
2. **Two buttons: "Classical (ECDH + AES)" vs. "Post-quantum (ML-KEM + AES-GCM)"** — clicking swaps every number on the screen live, so the audience can *see* the trade-off instantly instead of reading a static table.
3. **Four live stat cards:**
   - *Handshake time* (2.1 ms classical → 3.6 ms PQC — a small absolute increase)
   - *Key + ciphertext size* (64 B classical → 1,616 B PQC — the big jump)
   - *Energy per handshake* (0.16 mJ → 0.28 mJ)
   - *Quantum-safe?* (No → Yes — the entire point of doing this)
4. **Overhead bars** — visually show that the time and energy overhead is modest (~2–3× at most) while size overhead is the dominant cost.
5. **Attacker packet log** — shows 3 "captured packets" with a live caption explaining that classical session keys are recoverable once a quantum computer exists, but PQC session keys rely on a problem believed hard even against quantum attacks.
6. **Satellite profile dropdown** — switching between Profile A / B / C changes the live recommendation text, demonstrating that there's no single "correct" answer — the right PQC configuration depends on what you're flying.

**How to explain this on stage, in one sentence per screen:**
> "Here's a satellite talking to a ground station while someone eavesdrops. Watch what happens to the numbers when we switch from today's encryption to quantum-resistant encryption — the time barely changes, but the message size jumps, and that's the real cost we need to budget for on a satellite's tiny radio link."

---

## 7. What the benchmark numbers *mean* (not just what they are)

| Metric | Classical | PQC (ML-KEM-768 class) | What this means for a real satellite |
|---|---|---|---|
| Handshake time | ~2 ms | ~4–36 ms depending on chip | Happens once per session — even the slower end is a rounding error compared to a satellite pass lasting minutes. |
| CPU usage (reference study) | ~3.7% | ~8.7% (roughly 2.3×) | More heat generated — satellites can't cool by convection (no air in space), only by radiating heat away, so this matters for thermal design, not just speed. |
| Message overhead | 32–64 B | ~1,088–1,616 B | This is the *real* cost. On a narrowband CubeSat radio link, sending ~70× more data for the handshake means more scheduled contact time with the ground station — and ground station time is often billed by the minute. |
| Energy | Low | Modestly higher, but sometimes *lower* on constrained chips | Contradicts the "PQC = expensive" assumption people often make — our job is to actually test this, not repeat the assumption. |
| Quantum-safe | No | Yes | The entire reason this project exists. |

**The one-sentence takeaway for the whole project:**
> Post-quantum cryptography's computation is *not* the bottleneck — its **message size** is. That reframes the whole engineering problem from "can our satellite's CPU handle this?" (usually yes) to "can our satellite's *radio link* afford this?" (depends heavily on the mission).

---

## 8. Why this is a "big" project (for the "why it's big" slide)

- You **cannot** send a technician to fix a satellite's cryptography after launch — unlike almost every other computing system in the "harden against quantum" conversation, there is no second chance.
- Real state actors are **already** doing the "record now, decrypt later" attack against satellite links today — this isn't a hypothetical future threat, the recording is happening in the present tense.
- NIST only finalized ML-KEM/ML-DSA as official standards in **August 2024** — this is a genuinely current, unsettled engineering problem, not solved textbook material.
- Space cybersecurity is a fast-growing, government-funded research area right now, meaning our project sits directly in an active, real-world research gap rather than a purely academic exercise.
- It shares the same core tension as PQC-on-IoT (power-constrained devices), but with **higher stakes** (you can't patch it) and **harder constraints** (space radiation, no convective cooling, limited licensed spectrum).

---

## 9. Anticipated Q&A — be ready for these

**Q: If PQC keys are so much bigger, why not just make satellite radios faster?**
A: Bandwidth on satellite links is limited by licensed spectrum allocation and antenna/power constraints, not just radio hardware speed — you can't simply "add more bandwidth" the way you'd upgrade a home internet plan. That's exactly why right-sizing the PQC parameter set per mission (our Objective 6) matters.

**Q: Doesn't AES already resist quantum computers?**
A: Symmetric encryption like AES is only weakened, not broken, by quantum computers (via a different algorithm, Grover's, which just doubles the effective key length needed — so AES-256 stays safe). It's the *key exchange* step (ECDH) and *signatures* (ECDSA) that are catastrophically broken by Shor's algorithm, which is why our project focuses specifically on replacing those two.

**Q: Why not just use PQC everywhere, all the time, no need to test constrained profiles?**
A: Because some satellites genuinely cannot afford the memory or bandwidth overhead — that's the whole point of testing three profiles instead of assuming one-size-fits-all. A CubeSat with a UHF radio and a Cortex-M0+ chip is a fundamentally different budget than a modern smallsat bus.

**Q: How do you know your simulated numbers are realistic?**
A: We ground our benchmark harness and simulated profiles in published, peer-reviewed and industry benchmark data (cited in Section 10) rather than inventing numbers — e.g. the RP2040 (CubeSat-class chip) figures come from a real 2026 benchmarking paper, and the traffic/CPU comparison numbers come from a real TLS 1.3 measurement study.

**Q: Is this just theoretical, or does anyone actually do this in practice?**
A: NASA, ESA, and other space agencies are actively studying PQC migration for space assets, and CCSDS (the body that standardizes space data link protocols) already has a security framework that any PQC integration needs to fit inside rather than replace.

---

## 10. Sources we're relying on (so you can defend any number if asked)

- NIST FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA) — official standards, finalized August 2024.
- Chhetri, "Benchmarking NIST-Standardised ML-KEM and ML-DSA on ARM Cortex-M0+ (RP2040)" — the CubeSat-class chip benchmark (35.7 ms / 2.83 mJ / 17× faster than ECDH figures).
- "Layered Performance Analysis of TLS 1.3 Handshakes: Classical, Hybrid, and Pure Post-Quantum Key Exchange" — the CPU% and traffic (Mb/s) comparison numbers.
- ML-KEM key-size analysis (public key / ciphertext byte counts for ML-KEM-512/768/1024).
- MDPI *Information* (2025) study on ML-KEM in 5G authentication — supports the "size is the overhead, not compute time" conclusion in a different constrained-device context.
- CCSDS Space Data Link Security protocol documentation — the existing framework any real PQC satellite integration has to work within.

---

## 11. One-paragraph summary to memorize (elevator pitch)

> "Satellites fly for over a decade with cryptography that can never be updated, while adversaries are already recording their traffic today, waiting for quantum computers powerful enough to break it later. We built a simulated satellite-to-ground link that runs both today's encryption and the new NIST-standardized quantum-resistant encryption, benchmarked the real cost of each, and tested it against three realistic satellite hardware budgets. The finding: quantum-resistant cryptography isn't slow — its keys are just bigger — so the real engineering question isn't 'can the satellite's chip handle it,' it's 'can the satellite's radio link afford it,' and the right answer depends on which satellite you're flying."
