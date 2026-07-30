# data-sources/

**Live inputs. Do not archive or delete these.**

`baiw/scripts/prepare_data.py` reads this folder to regenerate the JSON datasets
in `baiw/src/data/`. It is invoked by:

```bash
./dev.sh data              # from the repo root
./dev.sh data --dry-run    # parse and report counts without writing
```

These four entries are here because a reference test found them — and only them —
named by the application surface. The other 127 root entries were not, and are in
[`../archive/`](../archive/).

| Entry | Read for |
|---|---|
| `fsdm_output/` | entities, relationships, attributes, domains, inheritance tree |
| `bvf_fsdm_output/` | capabilities, data requirements, BVF→FSDM mappings, dependencies, reuse scores and matrix, lineage, star schema, gap extensions, Pakistan banking context |
| `bacr_output/` | the assessment template fallback for BACR questions |
| `BACR - INTERVIEW MASTER - DA004462.xlsm` | the 804 BACR interview questions (preferred source) |

## The folder layout is load-bearing

`prepare_data.py` resolves its inputs as `<repo>/fsdm_output/…`,
`<repo>/bvf_fsdm_output/…`, `<repo>/bacr_output/…` and
`<repo>/BACR - INTERVIEW MASTER - DA004462.xlsm`. Those subfolder and file names
were preserved exactly so that pointing `--repo` at this directory needed no code
change in the script. **Renaming anything inside this folder will break
`./dev.sh data`.** `baiw/dev.sh` supplies the `--repo` value and fails loudly if
this directory is absent.

## The workbook is not in git

`*.xlsm` is gitignored, so `BACR - INTERVIEW MASTER - DA004462.xlsm` exists on
this machine only — as was already the case before the reorganisation. It is not
needed to build or run the app: `baiw/src/data/bacrQuestions.json` is committed
and current. It is needed only to re-derive that file. If the workbook goes
missing, `prepare_data.py` falls back to
`bacr_output/bacr_assessment_template.xlsx`, which **is** tracked.

## Verified

`./dev.sh data --dry-run` was captured before and after the move. All 15 datasets
parse to identical counts — 3,917 entities, 5,636 relationships, 15,364
attributes, 17,175 dependencies, 804 BACR questions and the rest. The only
difference in the output is the reported source path.
