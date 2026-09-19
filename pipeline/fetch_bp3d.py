"""Download a subset of BodyParts3D 4.3 meshes (CC BY-SA 2.1 JP, © DBCLS).

Source mirror: https://github.com/olivercase/body_parts_3d_api (Git LFS).
Files land in data/raw/bp3d/meshes/<original name>.obj — never committed.

Usage:  python3 pipeline/fetch_bp3d.py FJ1781 FJ7470 FJ7470M ...
        python3 pipeline/fetch_bp3d.py --list pipeline/bp3d_phase1.txt
"""
import sys, pathlib, urllib.request, urllib.parse, concurrent.futures as cf

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw/bp3d'
LFS = 'https://media.githubusercontent.com/media/olivercase/body_parts_3d_api/main/'

def wanted(args):
    ids = []
    it = iter(args)
    for a in it:
        if a == '--list':
            ids += [l.split('#')[0].strip() for l in open(next(it)) if l.split('#')[0].strip()]
        else:
            ids.append(a)
    return ids

def main():
    files = (RAW / 'files.txt').read_text().splitlines()
    by_fj = {f.split('/')[1].split('_')[0]: f for f in files}
    out = RAW / 'meshes'; out.mkdir(parents=True, exist_ok=True)
    jobs = []
    for fj in wanted(sys.argv[1:]):
        path = by_fj.get(fj)
        if not path:
            print('!! unknown id', fj); continue
        dst = out / path.split('/', 1)[1]
        if dst.exists() and dst.stat().st_size > 200:
            continue
        jobs.append((LFS + urllib.parse.quote(path), dst))
    def get(job):
        url, dst = job
        urllib.request.urlretrieve(url, dst)
        return dst.name, dst.stat().st_size
    with cf.ThreadPoolExecutor(8) as ex:
        for name, size in ex.map(get, jobs):
            print(f'{size/1024:8.1f} KB  {name}')
    print(len(jobs), 'downloaded')

if __name__ == '__main__':
    main()
