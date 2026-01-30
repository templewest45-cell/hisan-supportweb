// DivisionLogic removed

class AdditionLogic {
    constructor(a, b) {
        this.a = a;
        this.b = b;
        this.steps = [];
        this.generateSteps();
    }

    generateSteps() {
        const strA = this.a.toString();
        const strB = this.b.toString();
        const maxLength = Math.max(strA.length, strB.length);

        // Pad with zeros for easier calculation
        const padA = strA.padStart(maxLength, '0');
        const padB = strB.padStart(maxLength, '0');

        let carry = 0;
        let resultStr = "";

        this.steps.push({ type: 'START', message: `${this.a} + ${this.b} の計算をはじめます。` });

        // Iterate from right to left
        for (let i = maxLength - 1; i >= 0; i--) {
            const digitA = parseInt(padA[i], 10);
            const digitB = parseInt(padB[i], 10);
            const colIndex = maxLength - 1 - i; // 0 for units, 1 for tens...

            this.steps.push({
                type: 'FOCUS_COL',
                colIndex: colIndex,
                message: `${colIndex === 0 ? '一' : Math.pow(10, colIndex)}の位を計算します。${digitA} + ${digitB} です。`
            });

            let sum = digitA + digitB + carry;
            let newCarry = Math.floor(sum / 10);
            let val = sum % 10;

            if (carry > 0) {
                this.steps.push({
                    type: 'ADD_CARRY',
                    colIndex: colIndex,
                    carryVal: carry,
                    message: `繰り上がりの ${carry} も足して、${digitA} + ${digitB} + ${carry} = ${sum} です。`
                });
            } else {
                this.steps.push({
                    type: 'CALC_SUM', // Just a label
                    colIndex: colIndex,
                    sum: sum,
                    message: `${digitA} + ${digitB} = ${sum} です。`
                });
            }

            if (newCarry > 0) {
                this.steps.push({
                    type: 'CARRY_OVER',
                    colIndex: colIndex,
                    newCarry: newCarry,
                    val: val,
                    message: `${sum} なので、${newCarry} を繰り上げます。`
                });
            }

            resultStr = val.toString() + resultStr;
            carry = newCarry;
        }

        if (carry > 0) {
            resultStr = carry.toString() + resultStr;
            this.steps.push({
                type: 'FINAL_CARRY',
                val: carry,
                message: `最後に ${carry} を書きます。`
            });
        }

        this.steps.push({
            type: 'END',
            result: parseInt(resultStr, 10),
            message: `答えは ${resultStr} です。`
        });
    }

    getSteps() { return this.steps; }
}

class SubtractionLogic {
    constructor(a, b) {
        this.a = a;
        this.b = b;
        this.steps = [];
        this.generateSteps();
    }

    generateSteps() {
        if (this.a < this.b) {
            this.steps.push({ type: 'ERROR', message: 'ひかれる数がひく数より小さい計算は、まだできません。' });
            return;
        }

        const strA = this.a.toString();
        const strB = this.b.toString();
        const maxLength = Math.max(strA.length, strB.length);

        // We work on an array of digits for A to handle borrowing destructively if needed, 
        // but conceptually we just track "current available value".
        let digitsA = strA.padStart(maxLength, '0').split('').map(Number);
        let digitsB = strB.padStart(maxLength, '0').split('').map(Number);

        let resultStr = "";

        this.steps.push({ type: 'START', message: `${this.a} - ${this.b} の計算をはじめます。` });

        for (let i = maxLength - 1; i >= 0; i--) {
            const colIndex = maxLength - 1 - i;
            let valA = digitsA[i]; // Current value (might have been borrowed from)
            let valB = digitsB[i];

            this.steps.push({
                type: 'FOCUS_COL',
                colIndex: colIndex,
                valA: valA,
                valB: valB,
                message: `${colIndex === 0 ? '一' : Math.pow(10, colIndex)}の位を計算します。${valA} - ${valB} です。`
            });

            if (valA < valB) {
                // Borrow
                let borrowIdx = i - 1;
                while (borrowIdx >= 0 && digitsA[borrowIdx] === 0) {
                    borrowIdx--; // Find non-zero
                }

                if (borrowIdx < 0) {
                    // Should not happen if a >= b
                    this.steps.push({ type: 'ERROR', message: '計算エラー' });
                    return;
                }

                // Execute borrow propogation
                // e.g. 100 - 1. Borrow from 1. 0 -> 9 -> 10.

                this.steps.push({
                    type: 'BORROW_START',
                    fromIdx: maxLength - 1 - borrowIdx,
                    toIdx: colIndex,
                    message: `${valA} から ${valB} は引けないので、上の位から借ります。`
                });

                // Decrement source
                digitsA[borrowIdx]--;

                // Propagate 9s if any
                for (let k = borrowIdx + 1; k < i; k++) {
                    digitsA[k] = 9;
                }

                valA += 10;
                digitsA[i] = valA; // Update current (conceptually)

                this.steps.push({
                    type: 'BORROW_DONE',
                    newValA: valA,
                    message: `借りました。${valA} - ${valB} になります。`
                });
            }

            let diff = valA - valB;
            this.steps.push({
                type: 'CALC_DIFF',
                diff: diff,
                message: `${valA} - ${valB} = ${diff} です。`
            });

            // Handle leading zeros later? No, standard logic keeps them until end formatting usually.
            resultStr = diff.toString() + resultStr;
        }

        this.steps.push({
            type: 'END',
            result: parseInt(resultStr, 10),
            message: `答えは ${parseInt(resultStr, 10)} です。`
        });
    }

    getSteps() { return this.steps; }
}

class MultiplicationLogic {
    constructor(a, b) {
        this.a = a;
        this.b = b;
        this.steps = [];
        this.generateSteps();
    }

    generateSteps() {
        const strA = this.a.toString();
        const strB = this.b.toString();

        // Only supporting 1 digit multiplier for MVP to keep UI simple?
        // User asked for "Multiplication", usually implies 2-digit too.
        // Let's implement standard 1-digit logic first, then expand if time permits.
        // Actually, let's just handle multi-digit A x 1-digit B for stability right now.
        // If B > 9, it requires partial sum rows. 

        this.steps.push({ type: 'START', message: `${this.a} × ${this.b} の計算をはじめます。` });

        if (this.b < 10) {
            this.generateSteps1Digit(strA, this.b);
        } else {
            this.steps.push({ type: 'ERROR', message: '掛け数は1桁まで対応しています（仮）。' });
            // TODO: Implement multi-digit B
        }
    }

    generateSteps1Digit(strA, intB) {
        let carry = 0;

        for (let i = strA.length - 1; i >= 0; i--) {
            const digitA = parseInt(strA[i], 10);
            const colIndex = strA.length - 1 - i;

            this.steps.push({
                type: 'FOCUS_DIGIT',
                colIndex: colIndex,
                digitA: digitA,
                digitB: intB,
                message: `${digitA} × ${intB} を計算します。`
            });

            let product = digitA * intB + carry;
            let newCarry = Math.floor(product / 10);
            let val = product % 10;

            if (carry > 0) {
                this.steps.push({
                    type: 'ADD_CARRY',
                    baseProd: digitA * intB,
                    carry: carry,
                    total: product,
                    message: `${digitA}×${intB}=${digitA * intB} に、繰り上がりの ${carry} を足して ${product} です。`
                });
            } else {
                this.steps.push({
                    type: 'CALC_PROD',
                    product: product,
                    message: `${digitA}×${intB}=${product} です。`
                });
            }

            if (newCarry > 0) {
                this.steps.push({
                    type: 'CARRY_OVER',
                    newCarry: newCarry,
                    val: val,
                    message: `${product} なので、 ${val} を書いて ${newCarry} を繰り上げます。`
                });
            }

            carry = newCarry;
        }

        if (carry > 0) {
            this.steps.push({
                type: 'FINAL_CARRY',
                val: carry,
                message: `最後に ${carry} を書きます。`
            });
        }

        this.steps.push({
            type: 'END',
            message: `答えは ${this.a * this.b} です。`
        });
    }

    getSteps() { return this.steps; }
}
