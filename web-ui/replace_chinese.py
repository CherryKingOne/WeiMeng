#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to replace all remaining Chinese text in Workspace.vue with i18n translation keys
"""

import re

# Read the file
with open('src/views/Workspace.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# Define all replacements (Chinese text -> i18n key)
replacements = [
    # List view section
    (r'修改于：', r"{{ $t('workspace.modified_at') }}："),
    (r'>重命名<', r">{{ $t('workspace.rename') }}<"),
    (r'>分享链接<', r">{{ $t('workspace.share') }}<"),
    (r'>复制<', r">{{ $t('workspace.duplicate') }}<"),
    (r'>删除<', r">{{ $t('workspace.delete') }}<"),
    (r'>暂无内容<', r">{{ $t('workspace.no_content') }}<"),

    # Create modal
    (r'>新建设计稿<', r">{{ $t('workspace.new_design') }}<"),
    (r'>设计稿名称<', r">{{ $t('workspace.design_name') }}<"),
    (r'placeholder="请输入名称"', r":placeholder=\"$t('workspace.enter_design_name')\""),
    (r'>权限设置<', r">{{ $t('workspace.permission_settings') }}<"),
    (r'>私有<', r">{{ $t('workspace.private') }}<"),
    (r'>公开<', r">{{ $t('workspace.public') }}<"),
    (r'>团队<', r">{{ $t('workspace.team') }}<"),
    (r'>描述<', r">{{ $t('workspace.description') }}<"),
    (r'placeholder="可选"', r":placeholder=\"$t('workspace.optional')\""),
    (r'>取消<', r">{{ $t('workspace.cancel') }}<"),
    (r'>确定<', r">{{ $t('workspace.confirm') }}<"),

    # Duplicate modal
    (r'>复制项目<', r">{{ $t('workspace.duplicate_project') }}<"),
    (r'>名称<', r">{{ $t('workspace.duplicate_name') }}<"),

    # Settings modal
    (r'>OneFour 工作空间<', r">{{ $t('workspace.workspace_name') }}<"),
    (r'>成员 8 · 项目 24<', r">{{ $t('workspace.workspace_info') }}<"),
    (r'>工作空间<', r">{{ $t('workspace.settings_workspace') }}<"),
    (r'>模型供应商<', r">{{ $t('workspace.settings_providers') }}<"),
    (r'>数据来源<', r">{{ $t('workspace.settings_data') }}<"),
    (r'>API 扩展<', r">{{ $t('workspace.settings_api') }}<"),
    (r'>通用<', r">{{ $t('workspace.settings_general') }}<"),
    (r'>语言<', r">{{ $t('workspace.settings_language') }}<"),
    (r'>关闭<', r">{{ $t('workspace.close') }}<"),
    (r'>管理员<', r">{{ $t('workspace.admin_label') }}<"),
    (r'>邀请成员<', r">{{ $t('workspace.invite_members') }}<"),
    (r'placeholder="输入邮箱"', r":placeholder=\"$t('workspace.enter_email')\""),
    (r'>邀请<', r">{{ $t('workspace.invite') }}<"),
    (r'>搜索成员<', r">{{ $t('workspace.search_members') }}<"),
    (r'placeholder="输入姓名、邮箱或角色身份"', r":placeholder=\"$t('workspace.search_member_placeholder')\""),
    (r'>搜索<', r">{{ $t('workspace.search') }}<"),
    (r'>姓名<', r">{{ $t('workspace.member_name') }}<"),
    (r'>上次活动时间<', r">{{ $t('workspace.member_last_active') }}<"),
    (r'>角色<', r">{{ $t('workspace.member_role') }}<"),
    (r'>能够建立应用程序和管理团队设置<', r">{{ $t('workspace.admin_desc') }}<"),
    (r'>能够建立并编辑应用程序，不能管理团队设置<', r">{{ $t('workspace.editor_desc') }}<"),
    (r'>只能使用应用程序，不能建立应用程序<', r">{{ $t('workspace.member_desc') }}<"),
    (r'>移出团队<', r">{{ $t('workspace.remove_from_team') }}<"),
    (r'>配置知识库、图像库与外部数据连接。<', r">{{ $t('workspace.data_sources_desc') }}<"),
    (r'>管理 Webhook、插件和回调。<', r">{{ $t('workspace.api_extensions_desc') }}<"),
    (r'>通用设置<', r">{{ $t('workspace.general_settings') }}<"),
    (r'>主题<', r">{{ $t('workspace.theme') }}<"),
    (r'>浅色<', r">{{ $t('workspace.theme_light') }}<"),
    (r'>深色<', r">{{ $t('workspace.theme_dark') }}<"),
    (r'>跟随系统<', r">{{ $t('workspace.theme_system') }}<"),
    (r'>界面语言<', r">{{ $t('workspace.interface_language') }}<"),
    (r'>未选择<', r">{{ $t('workspace.not_selected') }}<"),
    (r'>时区<', r">{{ $t('workspace.timezone_label') }}<"),

    # Account modal
    (r'>我的账户<', r">{{ $t('workspace.my_account') }}<"),
    (r'>用户名<', r">{{ $t('workspace.username') }}<"),
    (r'>邮箱<', r">{{ $t('workspace.email') }}<"),
    (r'>更改<', r">{{ $t('workspace.change') }}<"),
    (r'>密码<', r">{{ $t('workspace.password') }}<"),
    (r'>如果您不想使用第三方登录，可以设置永久密码<', r">{{ $t('workspace.password_desc') }}<"),
    (r'>帐号关联数据<', r">{{ $t('workspace.account_data') }}<"),
    (r'>您的帐号相关的所有数据。<', r">{{ $t('workspace.account_data_desc') }}<"),
    (r'>显示 38 个应用<', r">{{ $t('workspace.show_apps') }}<"),
    (r'>项目<', r">{{ $t('workspace.projects') }}<"),
    (r'>上次活动<', r">{{ $t('workspace.last_activity') }}<"),
    (r'>保存<', r">{{ $t('workspace.save') }}<"),
    (r'>编辑<', r">{{ $t('workspace.change') }}<"),

    # Change email modal
    (r'>更改邮箱<', r">{{ $t('workspace.change_email_title') }}<"),
    (r'>验证新邮箱<', r">{{ $t('workspace.verify_new_email') }}<"),
    (r'>邮箱验证<', r">{{ $t('workspace.email_verification') }}<"),
    (r'>手机验证<', r">{{ $t('workspace.phone_verification') }}<"),
    (r'>密码验证<', r">{{ $t('workspace.password_verification') }}<"),
    (r'placeholder="请输入手机号"', r":placeholder=\"$t('workspace.enter_phone')\""),
    (r'placeholder="请输入账户密码"', r":placeholder=\"$t('workspace.enter_password')\""),
    (r'placeholder="请输入新邮箱地址"', r":placeholder=\"$t('workspace.new_email_placeholder')\""),
    (r'placeholder="请输入6位验证码"', r":placeholder=\"$t('workspace.enter_6_digit_code')\""),
    (r'>发送中...<', r">{{ $t('workspace.sending_code') }}<"),
    (r'>获取验证码<', r">{{ $t('workspace.get_code') }}<"),
    (r'>下一步<', r">{{ $t('workspace.next_step') }}<"),

    # About modal
    (r'>现已可用。<', r">{{ $t('workspace.version_available', { version: latestVersion }) }}<"),
    (r'>更新日志<', r">{{ $t('workspace.changelog') }}<"),

    # Upgrade modal
    (r'>OneFour 套餐<', r">{{ $t('workspace.onefour_plans') }}<"),
    (r'>选择最适合你团队的服务方式<', r">{{ $t('workspace.plans_desc') }}<"),
    (r'>云服务<', r">{{ $t('workspace.cloud_service') }}<"),
    (r'>自部署<', r">{{ $t('workspace.self_hosted') }}<"),
    (r'>按年计费节省 17%<', r">{{ $t('workspace.annual_billing') }}<"),
    (r'>免费试用核心功能<', r">{{ $t('workspace.sandbox_desc') }}<"),
    (r'>免费<', r">{{ $t('workspace.free') }}<"),
    (r'>当前计划<', r">{{ $t('workspace.current_plan') }}<"),
    (r'>构建生产级应用的小团队<', r">{{ $t('workspace.professional_desc') }}<"),
    (r'>最受欢迎<', r">{{ $t('workspace.most_popular') }}<"),
    (r'>/空间/月<', r">{{ $t('workspace.per_space_month') }}<"),
    (r'>/每个团队空间/年<', r">{{ $t('workspace.per_space_year') }}<"),
    (r'>开始构建<', r">{{ $t('workspace.start_building') }}<"),
    (r'>协作与更高吞吐量的团队<', r">{{ $t('workspace.team_desc') }}<"),
    (r'>立即开始<', r">{{ $t('workspace.start_now') }}<"),
    (r'>开源爱好者与个人项目<', r">{{ $t('workspace.community_desc') }}<"),
    (r'>开始使用<', r">{{ $t('workspace.start_using') }}<"),
    (r'>需要增强支持的团队<', r">{{ $t('workspace.premium_desc') }}<"),
    (r'>可扩展<', r">{{ $t('workspace.scalable') }}<"),
    (r'>通过云市场获取<', r">{{ $t('workspace.get_via_marketplace') }}<"),
    (r'>需要安全与合规的企业<', r">{{ $t('workspace.enterprise_desc') }}<"),
    (r'>定制<', r">{{ $t('workspace.custom') }}<"),
    (r'>联系销售<', r">{{ $t('workspace.contact_sales') }}<"),

    # Reset password modal
    (r'>重置密码<', r">{{ $t('workspace.reset_password') }}<"),
    (r'>新密码<', r">{{ $t('workspace.new_password_label') }}<"),
    (r'placeholder="至少8位"', r":placeholder=\"$t('workspace.at_least_8')\""),
    (r'>确认密码<', r">{{ $t('workspace.confirm_password_label') }}<"),
    (r'placeholder="再次输入新密码"', r":placeholder=\"$t('workspace.enter_new_password_again')\""),
    (r'>验证码<', r">{{ $t('workspace.verification_code_label') }}<"),
    (r'>发送验证码<', r">{{ $t('workspace.send_code') }}<"),
    (r'>重置<', r">{{ $t('workspace.reset') }}<"),

    # Recent modal
    (r'>最近浏览<', r">{{ $t('workspace.recent_viewed') }}<"),
    (r'>清除<', r">{{ $t('workspace.clear') }}<"),
    (r'placeholder="搜索名称或时间"', r":placeholder=\"$t('workspace.search_name_time')\""),
    (r'>暂无记录<', r">{{ $t('workspace.no_records') }}<"),

    # Favorites modal
    (r'>收藏夹<', r">{{ $t('workspace.favorites_title') }}<"),
    (r'>个人空间<', r">{{ $t('workspace.personal_space') }}<"),
    (r'>最后修改<', r">{{ $t('workspace.last_modified') }}<"),
    (r'placeholder="搜索收藏的原型..."', r":placeholder=\"$t('workspace.search_favorites')\""),
    (r'>暂无收藏<', r">{{ $t('workspace.no_favorites') }}<"),

    # Add member modal
    (r'>添加团队成员<', r">{{ $t('workspace.add_member_title') }}<"),
    (r'>邮箱<', r">{{ $t('workspace.email_invite') }}<"),
    (r'placeholder="输入邮箱地址"', r":placeholder=\"$t('workspace.enter_email_address')\""),
    (r'>通过邮箱邀请成员，姓名可选<', r">{{ $t('workspace.email_invite_desc') }}<"),
    (r'>已添加成员<', r">{{ $t('workspace.added_members') }}<"),
    (r'>添加<', r">{{ $t('workspace.add') }}<"),

    # Create team modal
    (r'>创建新团队<', r">{{ $t('workspace.create_team_title') }}<"),
    (r'>团队名称<', r">{{ $t('workspace.team_name') }}<"),
    (r'placeholder="输入团队名称"', r":placeholder=\"$t('workspace.team_name_placeholder')\""),
    (r'>描述（可选）<', r">{{ $t('workspace.team_description') }}<"),
    (r'placeholder="填写团队描述"', r":placeholder=\"$t('workspace.enter_team_description')\""),
    (r'>团队图标（可选）<', r">{{ $t('workspace.team_icon') }}<"),
    (r'>点击上传团队图标<', r">{{ $t('workspace.click_upload_icon') }}<"),
    (r'>创建团队<', r">{{ $t('workspace.create_team_button') }}<"),

    # Invite link modal
    (r'>邀请链接<', r">{{ $t('workspace.share_link_label') }}<"),
    (r'>分享<', r">{{ $t('workspace.share_button') }}<"),
    (r'>复制<', r">{{ $t('workspace.copy_button') }}<"),
]

# Apply all replacements
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Write back to file
with open('src/views/Workspace.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement complete!")
