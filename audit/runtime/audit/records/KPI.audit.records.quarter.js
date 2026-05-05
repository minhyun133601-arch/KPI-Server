        function getQuarterInfo(date) {
            const month = date.getMonth(); // 0-11
            const quarter = Math.floor(month / 3) + 1;
            return { year: date.getFullYear(), quarter };
        }

        function makeQuarterKey(year, quarter) {
            return `${year}-Q${quarter}`;
        }

        function parseQuarterKey(key) {
            const match = /^(\d{4})-Q([1-4])$/.exec(key || '');
            if (!match) return null;
            return { year: parseInt(match[1], 10), quarter: parseInt(match[2], 10) };
        }

        function quarterIndex(key) {
            const parsed = parseQuarterKey(key);
            if (!parsed) return null;
            return parsed.year * 4 + (parsed.quarter - 1);
        }

        function normalizeQuarterRange(startKey, endKey) {
            const now = getQuarterInfo(new Date());
            const fallback = makeQuarterKey(now.year, now.quarter);
            let start = startKey || fallback;
            let end = endKey || fallback;
            const startIdx = quarterIndex(start);
            const endIdx = quarterIndex(end);
            if (startIdx === null || endIdx === null) {
                start = fallback;
                end = fallback;
            } else if (startIdx > endIdx) {
                const tmp = start;
                start = end;
                end = tmp;
            }
            return { start, end };
        }
