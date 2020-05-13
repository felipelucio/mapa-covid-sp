import os, sys
import glob
import json
import getopt

def createDataset(path, output):
    names = json.load(open('./names.json', 'r', encoding='utf-8'))
    dataset = {
        "version":"0.2", 
        "names": names['names'],
        "dataset": []
    }

    files = glob.glob(os.path.join(path, "*.json"))
    for f in files:
        with open(f, 'r', encoding='utf-8') as fobj:
            dataset["dataset"].append(json.load(fobj))

    with open(output, 'w', encoding='utf-8') as outf:
        json.dump(dataset, outf, ensure_ascii=False)



if __name__ == "__main__":
    opts, args = getopt.getopt(sys.argv[1:], "-c")
    createDataset(sys.argv[1], sys.argv[2])