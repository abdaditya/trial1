"""Find YouTube channels in the zbacktrack niche and start tracking them.

Runs many niche searches, counts which channels keep turning up, checks a list of
well-known explainer channels, and adds the best ones as tracked creators.

  python -m app.discover [how_many]      (default 110)
"""
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor

from . import collect_ytdlp, config, db

QUERIES = """nvidia ai chips explained|why nvidia is winning|tsmc explained|asml euv machine explained|
how semiconductors are made|chip war explained|ai data center explained|data center power problem|
ai bubble explained|openai business model explained|anthropic explained|big tech acquisition explained|
why google bought|why microsoft invested|amazon aws ai strategy|meta ai spending|apple ai strategy|
india semiconductor mission explained|india data centre boom|india ai explained|jio ai strategy|isro explained|
navic explained|spacex starlink business explained|satellite internet explained|how gpu works|
tech business case study|startup case study india|business case study shorts|tech explained shorts|
ai news explained shorts|geopolitics of chips|china chip ban explained|huawei chip explained|deepseek explained|
quantum computing explained|nuclear power for ai|ai energy crisis|undersea cables explained|5g 6g explained|
how the internet works|samsung vs tsmc|intel downfall explained|amd vs nvidia|qualcomm explained|arm explained|
tesla robot explained|humanoid robots explained|tech company history documentary|how big tech makes money|
billion dollar deal explained|why startups fail case study|softbank explained|foxconn india|tata semiconductor|
ai infrastructure explained|cloud computing business explained|hidden companies behind ai""".replace("\n", "").split("|")

SEEDS = """asianometry ColdFusion fireship PolyMatter TechAltar CleoAbram ThinkSchool mohakmangal VarunMayya
AnastasiInTech DrBenMiles TwoMinutePapers matthew_berman aiexplained-official DwarkeshPatel CNBC business
wsj veritasium RealEngineering BranchEducation Zero1byZerodha LabourLawAdvisor HowMoneyWorks ModernMBA
LogicallyAnswered MagnatesMedia TheInfographicsShow economicsexplained JohnnyHarris Vox mkbhd Computerphile
NewMind SabineHossenfelder aiDotEngineer TheAIGRID ByteByteGo NetworkChuck LinusTechTips Level1Techs
ServeTheHomeVideo GamersNexus TechLinked ShortCircuit undecidedmf PracticalEngineeringChannel
Wendoverproductions halfasinteresting B1M TomScottGo neo MKBHDshorts YCombinator a16z LexFridman
AllInPodcast StratecheryBen cnbctv18 ETNOWlive MoneycontrolLive TheEconomicTimes FinologyLegal
AbhiandNiyu DhruvRathee NitishRajput SochbyMM TheDeshBhakt AkshatShrivastava warikoo PowerfulJRE
EverydayAstronaut ScottManley Fraser_Cain smartereveryday TheEngineeringMindset LearnEngineering
Explainingcomputers IBMTechnology GoogleDeepMind NVIDIA TechQuickie ACQ2 acquiredfm bloombergoriginals
BloombergTechnology FinancialTimes TheEconomist ReutersVideo""".split()


def search_counts(queries=QUERIES, per_query=30):
    chans = {}

    def one(q):
        try:
            return q, collect_ytdlp.search_youtube(q, per_query)
        except Exception:  # noqa: BLE001
            return q, []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for q, recs in pool.map(one, queries):
            for r in recs:
                cid = r["extra"].get("channel_id")
                if not cid:
                    continue
                c = chans.setdefault(cid, {"id": cid, "name": r["extra"].get("channel") or "", "queries": set(),
                                           "hits": 0, "views": 0})
                c["queries"].add(q)
                c["hits"] += 1
                c["views"] += r.get("views") or 0
    return chans


def valid_seed(handle):
    try:
        info = collect_ytdlp._extract("https://www.youtube.com/@%s/videos" % handle,
                                      extract_flat="in_playlist", playlistend=1)
        return handle, bool(info.get("entries"))
    except Exception:  # noqa: BLE001
        return handle, False


def main(argv):
    want = int(argv[0]) if argv else 110
    con = db.connect(config.DB_PATH)
    tracked = {(c["platform"], c["handle"]) for c in db.list_creators(con)}
    with ThreadPoolExecutor(max_workers=6) as pool:
        seeds = [h for h, ok in pool.map(valid_seed, SEEDS) if ok]
    chans = search_counts()
    ranked = sorted((c for c in chans.values() if len(c["queries"]) >= 2),
                    key=lambda c: (len(c["queries"]), c["hits"]), reverse=True)
    added = []
    for h in seeds:
        key = ("youtube", db.normalize_handle("youtube", h))
        if key not in tracked and len(added) < want:
            db.add_creator(con, "youtube", h)
            tracked.add(key)
            added.append({"handle": h, "why": "known explainer channel"})
    for c in ranked:
        if len(added) >= want:
            break
        if ("youtube", c["id"]) in tracked:
            continue
        db.add_creator(con, "youtube", c["id"])
        tracked.add(("youtube", c["id"]))
        added.append({"handle": c["id"], "name": c["name"], "why": "%d niche searches" % len(c["queries"])})
    os.makedirs(os.path.join(config.ROOT, "data"), exist_ok=True)
    json.dump(added, open(os.path.join(config.ROOT, "data", "discovered.json"), "w"), ensure_ascii=False, indent=1)
    print("seeds ok: %d of %d | channels seen in searches: %d | in 2+ searches: %d | added: %d"
          % (len(seeds), len(SEEDS), len(chans), len(ranked), len(added)))
    for a in added:
        print(" ", a.get("name") or a["handle"], "-", a["why"])


if __name__ == "__main__":
    main(sys.argv[1:])
