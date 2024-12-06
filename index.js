import fetch from 'node-fetch';
import fs from 'fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import { Table } from 'console-table-printer';

async function checkEligibility(address) {
    try {
        const response = await fetch(`https://api.streamflow.foundation/v2/api/airdrop-recipients/check-eligibility?address=${address}&chain=Solana`);
        const data = await response.json();
        return {
            address,
            eligible: data.isEligible,
            points: data.points || 0
        };
    } catch (error) {
        return {
            address,
            eligible: false,
            points: 0,
            error: error.message
        };
    }
}

async function main() {
    console.clear();
    console.log(chalk.blue.bold('\n🔍 Solana Wallet Checker\n'));

    const spinner = ora('Reading wallet.txt').start();
    
    try {
        const content = await fs.readFile('wallet.txt', 'utf8');
        const addresses = content.split('\n').filter(line => line.trim());
        
        spinner.text = 'Checking wallets';
        
        const results = [];
        for (const [index, address] of addresses.entries()) {
            spinner.text = `Checking wallet ${index + 1}/${addresses.length}`;
            const result = await checkEligibility(address.trim());
            results.push(result);
        }

        spinner.succeed('Check completed');

        const table = new Table({
            columns: [
                { name: 'address', title: 'WALLET', alignment: 'left' },
                { name: 'eligible', title: 'ELIGIBLE', alignment: 'center' },
                { name: 'points', title: 'POINTS', alignment: 'center' }
            ]
        });

        results.forEach(result => {
            table.addRow({
                address: result.address.substring(0, 16) + '...',
                eligible: result.eligible ? chalk.green('✓') : chalk.red('✗'),
                points: result.points
            });
        });

        console.log();
        table.printTable();

        const stats = {
            total: results.length,
            eligible: results.filter(r => r.eligible).length,
            totalPoints: results.reduce((sum, r) => sum + r.points, 0)
        };

        console.log(chalk.cyan('\n📊 Summary:'));
        console.log(`Total Wallets: ${chalk.yellow(stats.total)}`);
        console.log(`Eligible: ${chalk.green(stats.eligible)}`);
        console.log(`Total Points: ${chalk.magenta(stats.totalPoints)}\n`);

    } catch (error) {
        spinner.fail(chalk.red(`Error: ${error.message}`));
    }
}

main();