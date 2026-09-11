<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance Optimization Migration
 * 
 * Adds database indexes to columns used in WHERE, ORDER BY, and JOIN clauses
 * on the transactions, memberships, and attendances tables.
 *
 * WITHOUT indexes: MySQL does a full table scan on every query — O(n)
 * WITH indexes:    MySQL uses B-tree lookup — O(log n), dramatically faster
 *
 * This migration is SAFE — it only adds indexes, no data is modified or deleted.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── TRANSACTIONS ─────────────────────────────────────────────────────
        // transaction_date: used in ORDER BY and whereBetween in both
        //   TransactionController and ReportController
        // member_id: used in eager load JOIN (with('member'))
        Schema::table('transactions', function (Blueprint $table) {
            if (!$this->indexExists('transactions', 'transactions_transaction_date_index')) {
                $table->index('transaction_date', 'transactions_transaction_date_index');
            }
            if (!$this->indexExists('transactions', 'transactions_member_id_index')) {
                $table->index('member_id', 'transactions_member_id_index');
            }
            if (!$this->indexExists('transactions', 'transactions_status_index')) {
                $table->index('status', 'transactions_status_index');
            }
        });

        // ── MEMBERSHIPS ───────────────────────────────────────────────────────
        // status: used in WHERE status='Active'/'Expired' queries
        // member_id: used in eager load JOIN (with('member'))
        // created_at: used in whereBetween in ReportController
        // start_date / end_date: used in dashboard expiring-soon query
        Schema::table('memberships', function (Blueprint $table) {
            if (!$this->indexExists('memberships', 'memberships_status_index')) {
                $table->index('status', 'memberships_status_index');
            }
            if (!$this->indexExists('memberships', 'memberships_member_id_index')) {
                $table->index('member_id', 'memberships_member_id_index');
            }
            if (!$this->indexExists('memberships', 'memberships_end_date_index')) {
                $table->index('end_date', 'memberships_end_date_index');
            }
            if (!$this->indexExists('memberships', 'memberships_created_at_index')) {
                $table->index('created_at', 'memberships_created_at_index');
            }
        });

        // ── ATTENDANCES ───────────────────────────────────────────────────────
        // date: used in ORDER BY and whereBetween in ReportController
        // member_id: used in eager load JOIN (with('member'))
        Schema::table('attendances', function (Blueprint $table) {
            if (!$this->indexExists('attendances', 'attendances_date_index')) {
                $table->index('date', 'attendances_date_index');
            }
            if (!$this->indexExists('attendances', 'attendances_member_id_index')) {
                $table->index('member_id', 'attendances_member_id_index');
            }
        });

        // ── MEMBERS ───────────────────────────────────────────────────────────
        // status: used in WHERE status='Active' filter queries
        // created_at: used in whereBetween for new signups in ReportController
        Schema::table('members', function (Blueprint $table) {
            if (!$this->indexExists('members', 'members_status_index')) {
                $table->index('status', 'members_status_index');
            }
            if (!$this->indexExists('members', 'members_created_at_index')) {
                $table->index('created_at', 'members_created_at_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndexIfExists('transactions_transaction_date_index');
            $table->dropIndexIfExists('transactions_member_id_index');
            $table->dropIndexIfExists('transactions_status_index');
        });

        Schema::table('memberships', function (Blueprint $table) {
            $table->dropIndexIfExists('memberships_status_index');
            $table->dropIndexIfExists('memberships_member_id_index');
            $table->dropIndexIfExists('memberships_end_date_index');
            $table->dropIndexIfExists('memberships_created_at_index');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndexIfExists('attendances_date_index');
            $table->dropIndexIfExists('attendances_member_id_index');
        });

        Schema::table('members', function (Blueprint $table) {
            $table->dropIndexIfExists('members_status_index');
            $table->dropIndexIfExists('members_created_at_index');
        });
    }

    /**
     * Check if an index already exists to prevent duplicate index errors.
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = \DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = '{$indexName}'");
        return count($indexes) > 0;
    }
};
