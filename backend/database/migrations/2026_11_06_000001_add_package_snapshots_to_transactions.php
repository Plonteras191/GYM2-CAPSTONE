<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('transactions', 'package_name_snapshot')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->string('package_name_snapshot')->nullable();
            });
        }

        if (!Schema::hasColumn('transactions', 'package_category_snapshot')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->string('package_category_snapshot')->nullable();
            });
        }

        DB::table('transactions')
            ->leftJoin('memberships', 'transactions.membership_id', '=', 'memberships.id')
            ->leftJoin('plans', 'memberships.plan_id', '=', 'plans.id')
            ->select(
                'transactions.id as transaction_row_id',
                'transactions.type',
                'transactions.description',
                'transactions.package_name_snapshot',
                'transactions.package_category_snapshot',
                'memberships.plan_type',
                'plans.name as catalog_plan_name',
                'plans.category as catalog_plan_category'
            )
            ->orderBy('transactions.id')
            ->chunkById(100, function ($transactions) {
                foreach ($transactions as $transaction) {
                    $description = trim((string) $transaction->description);
                    $planName = null;
                    if ($transaction->type === 'Subscription Upgrade' && str_contains($description, ' to ')) {
                        $planName = trim(substr($description, strrpos($description, ' to ') + 4));
                    } elseif (preg_match('/^(.+?)\s+(?:Plan Payment|Package)$/i', $description, $matches)) {
                        $planName = trim($matches[1]);
                    }

                    $snapshot = [];
                    if ($transaction->package_name_snapshot === null) {
                        $snapshot['package_name_snapshot'] = $planName ?: ($transaction->catalog_plan_name ?: $transaction->plan_type);
                    }
                    if ($transaction->package_category_snapshot === null) {
                        $snapshot['package_category_snapshot'] = $transaction->catalog_plan_category;
                    }

                    if ($snapshot) {
                        DB::table('transactions')
                            ->where('id', $transaction->transaction_row_id)
                            ->update($snapshot);
                    }
                }
            }, 'transactions.id', 'transaction_row_id');
    }

    public function down(): void
    {
        $columns = array_filter(
            ['package_name_snapshot', 'package_category_snapshot'],
            fn ($column) => Schema::hasColumn('transactions', $column)
        );

        if ($columns) {
            Schema::table('transactions', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }
};
