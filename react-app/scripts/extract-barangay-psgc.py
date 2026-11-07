"""Extract the current PSA identifiers and hierarchy without altering the workbook."""

import json
import sys

from openpyxl import load_workbook


def extract(filename):
    workbook = load_workbook(filename, read_only=True, data_only=True)
    rows = workbook['PSGC'].iter_rows(values_only=True)
    header = next(rows)
    if header[1:5] != ('10-digit PSGC', 'Name', 'Correspondence Code', 'Geographic Level'):
        raise ValueError('Unexpected PSGC column layout')

    cities = {}
    parent = None
    region = None
    identifiers = set()
    for _, psgc, name, correspondence, level, old_name, *_ in rows:
        if psgc is not None:
            psgc = str(psgc).zfill(10)
        if level == 'Reg':
            region = psgc
        if level in ('Reg', 'Prov', 'Dist', 'SGA'):
            parent = None
        if level in ('City', 'Mun'):
            parent = psgc
            if parent in cities or region is None:
                raise ValueError(f'Invalid city or municipality row: {parent}')
            cities[parent] = {'name': name.strip(), 'region': region, 'barangays': []}
        if level == 'Bgy':
            if parent is None or psgc in identifiers:
                raise ValueError(f'Barangay has no parent or is duplicated: {psgc}')
            if region != '1300000000' and psgc[:7] != parent[:7]:
                raise ValueError(f'Barangay code conflicts with its listed parent: {psgc}, {parent}')
            identifiers.add(psgc)
            cities[parent]['barangays'].append([psgc, name.strip(), old_name, correspondence])

    if len(cities) != 1642 or len(identifiers) != 42010:
        raise ValueError(f'Unexpected Q3 2026 totals: {len(cities)} localities, {len(identifiers)} barangays')
    workbook.close()
    return cities


if __name__ == '__main__':
    with open(sys.argv[2], 'w', encoding='utf-8') as destination:
        json.dump(extract(sys.argv[1]), destination, ensure_ascii=False, separators=(',', ':'))
