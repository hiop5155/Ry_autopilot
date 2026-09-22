#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PID隨機生成器 (app/id_helper.py)
演算法: 首字母轉對應二位數 (d0, d1)，依權重 [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1] 加權取餘數。
"""

import random
from typing import Optional

LETTER_MAP = {
    'A': (1, 0), 'B': (1, 1), 'C': (1, 2), 'D': (1, 3), 'E': (1, 4),
    'F': (1, 5), 'G': (1, 6), 'H': (1, 7), 'I': (3, 4), 'J': (1, 8),
    'K': (1, 9), 'L': (2, 0), 'M': (2, 1), 'N': (2, 2), 'O': (3, 5),
    'P': (2, 3), 'Q': (2, 4), 'R': (2, 5), 'S': (2, 6), 'T': (2, 7),
    'U': (2, 8), 'V': (2, 9), 'W': (3, 2), 'X': (3, 0), 'Y': (3, 1),
    'Z': (3, 3)
}

def validate_roc_id(roc_id: str) -> bool:
    """驗證PID是否合法有效"""
    roc_id = (roc_id or "").strip().upper()
    if len(roc_id) != 10:
        return False

    first_char = roc_id[0]
    if first_char not in LETTER_MAP:
        return False

    # 第二碼必須為 1 (男) 或 2 (女)
    if roc_id[1] not in ('1', '2'):
        return False

    # 後續皆需為數字
    if not roc_id[1:].isdigit():
        return False

    d0, d1 = LETTER_MAP[first_char]
    digits = [int(c) for c in roc_id[1:]]

    # 計算加權和
    total = (d0 * 1) + (d1 * 9)
    weights = [8, 7, 6, 5, 4, 3, 2, 1]
    for i in range(8):
        total += digits[i] * weights[i]

    # 檢查碼 (最後一碼)
    check_digit = (10 - (total % 10)) % 10
    return check_digit == digits[8]

def generate_roc_id(letter: Optional[str] = None, gender: Optional[int] = None) -> str:
    """隨機生成一組PID"""
    if not letter or letter.upper() not in LETTER_MAP:
        letter = random.choice(list(LETTER_MAP.keys()))
    else:
        letter = letter.upper()

    if gender not in (1, 2):
        gender = random.choice([1, 2])

    d0, d1 = LETTER_MAP[letter]
    mid_digits = [random.randint(0, 9) for _ in range(7)]

    # 加權計算
    total = (d0 * 1) + (d1 * 9) + (gender * 8)
    weights = [7, 6, 5, 4, 3, 2, 1]
    for i in range(7):
        total += mid_digits[i] * weights[i]

    check_digit = (10 - (total % 10)) % 10
    result = f"{letter}{gender}{''.join(str(d) for d in mid_digits)}{check_digit}"
    return result

if __name__ == "__main__":
    for _ in range(5):
        sample = generate_roc_id()
        print(f"Generated: {sample}, Valid: {validate_roc_id(sample)}")
